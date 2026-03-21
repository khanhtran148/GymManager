using FluentAssertions;
using GymManager.Application.Invitations.AcceptInvitation;
using GymManager.Application.Invitations.CreateInvitation;
using GymManager.Domain.Enums;
using GymManager.Tests.Common.Builders;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymManager.Application.Tests.Invitations;

public sealed class AcceptInvitationCommandHandlerTests : ApplicationTestBase
{
    private async Task<(string Token, Guid GymHouseId)> CreateValidInvitationAsync(
        string email = "newinvitee@example.com",
        Role role = Role.Staff)
    {
        var (_, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Accept Test Gym");

        var createResult = await Sender.Send(new CreateInvitationCommand(email, role, gymHouse.Id));
        createResult.IsSuccess.Should().BeTrue();
        return (createResult.Value.Token, gymHouse.Id);
    }

    [Fact]
    public async Task Accept_ValidToken_NewUser_CreatesUserAndMember()
    {
        var (token, _) = await CreateValidInvitationAsync("brandnew@example.com", Role.Member);

        var command = new AcceptInvitationCommand(token, "Password123!", "Brand New User");

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Email.Should().Be("brandnew@example.com");
        result.Value.FullName.Should().Be("Brand New User");
        result.Value.AccessToken.Should().NotBeNullOrEmpty();
        result.Value.RefreshToken.Should().NotBeNullOrEmpty();
        result.Value.UserId.Should().NotBeEmpty();

        var member = await DbContext.Members
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.User.Email == "brandnew@example.com");
        member.Should().NotBeNull();
    }

    [Fact]
    public async Task Accept_ValidToken_ExistingUser_LinksToGym()
    {
        var (_, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Existing User Gym");
        var (existingUser, _) = await CreateMemberAsync(gymHouse.Id, $"existing{Guid.NewGuid()}@example.com");

        // Create a second gym and invite existing user as Staff
        var (_, gymHouse2) = await CreateOwnerAsync($"owner2{Guid.NewGuid()}@test.com", "Second Gym");
        var createResult = await Sender.Send(new CreateInvitationCommand(existingUser.Email, Role.Staff, gymHouse2.Id));
        createResult.IsSuccess.Should().BeTrue();
        var token = createResult.Value.Token;

        // Reset current user context back to owner of second gym
        CurrentUser.TenantId = gymHouse2.OwnerId;

        var command = new AcceptInvitationCommand(token, null, null);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Email.Should().Be(existingUser.Email);
        result.Value.UserId.Should().Be(existingUser.Id);
    }

    [Fact]
    public async Task Accept_ExpiredToken_ReturnsBadRequest()
    {
        var (owner, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Expired Gym");

        var expiredInvitation = new InvitationBuilder()
            .WithTenantId(owner.Id)
            .WithEmail("expired@example.com")
            .WithRole(Role.Staff)
            .WithGymHouseId(gymHouse.Id)
            .WithToken("expired-token-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
            .WithExpiresAt(DateTime.UtcNow.AddHours(-1))
            .WithCreatedBy(owner.Id)
            .Build();

        DbContext.Set<GymManager.Domain.Entities.Invitation>().Add(expiredInvitation);
        await DbContext.SaveChangesAsync();

        var command = new AcceptInvitationCommand("expired-token-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "Password123!", "User");

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("expired");
    }

    [Fact]
    public async Task Accept_AlreadyAcceptedToken_ReturnsBadRequest()
    {
        var (token, _) = await CreateValidInvitationAsync("onceonly@example.com", Role.Staff);

        await Sender.Send(new AcceptInvitationCommand(token, "Password123!", "Once Only User"));

        var result = await Sender.Send(new AcceptInvitationCommand(token, "Password123!", "Once Only User"));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("accepted");
    }

    [Fact]
    public async Task Accept_InvalidToken_ReturnsNotFound()
    {
        var command = new AcceptInvitationCommand("nonexistent-token-that-does-not-exist", "Password123!", "User");

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("NOT_FOUND");
    }

    [Fact]
    public async Task Accept_SetsAcceptedAt()
    {
        var (token, _) = await CreateValidInvitationAsync("setacceptedat@example.com", Role.Staff);

        var before = DateTime.UtcNow;
        await Sender.Send(new AcceptInvitationCommand(token, "Password123!", "Test User"));

        var invitation = await DbContext.Set<GymManager.Domain.Entities.Invitation>()
            .AsNoTracking()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(i => i.Token == token);

        invitation.Should().NotBeNull();
        invitation!.AcceptedAt.Should().NotBeNull();
        invitation.AcceptedAt!.Value.Should().BeOnOrAfter(before);
    }

    [Fact]
    public async Task Accept_ReturnsJwtWithTenantId()
    {
        var (token, _) = await CreateValidInvitationAsync("jwtclaim@example.com", Role.Staff);

        var result = await Sender.Send(new AcceptInvitationCommand(token, "Password123!", "JWT Claim User"));

        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().NotBeNullOrEmpty();

        // Decode the JWT and verify tenant_id claim is present (non-empty)
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(result.Value.AccessToken);
        var tenantIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "tenant_id");
        tenantIdClaim.Should().NotBeNull();
        tenantIdClaim!.Value.Should().NotBeNullOrEmpty();
        Guid.TryParse(tenantIdClaim.Value, out _).Should().BeTrue();
    }
}
