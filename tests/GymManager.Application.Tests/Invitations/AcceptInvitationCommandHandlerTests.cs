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
    private async Task<(string Token, Guid GymHouseId, Guid TenantId)> CreateValidInvitationAsync(
        string email = "newinvitee@example.com",
        Role role = Role.Staff)
    {
        var (owner, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Accept Test Gym");

        var createResult = await Sender.Send(new CreateInvitationCommand(email, role, gymHouse.Id));
        createResult.IsSuccess.Should().BeTrue();
        return (createResult.Value.Token, gymHouse.Id, owner.Id);
    }

    [Fact]
    public async Task Accept_ValidToken_NewUser_CreatesUserAndMember()
    {
        var (token, _, _) = await CreateValidInvitationAsync("brandnew@example.com", Role.Member);

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

        // Existing user must supply their password (Fix #7)
        var command = new AcceptInvitationCommand(token, "Test@1234", null);

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
        var (token, _, _) = await CreateValidInvitationAsync("onceonly@example.com", Role.Staff);

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
        var (token, _, _) = await CreateValidInvitationAsync("setacceptedat@example.com", Role.Staff);

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
        var (token, _, _) = await CreateValidInvitationAsync("jwtclaim@example.com", Role.Staff);

        var result = await Sender.Send(new AcceptInvitationCommand(token, "Password123!", "JWT Claim User"));

        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().NotBeNullOrEmpty();

        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(result.Value.AccessToken);
        var tenantIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "tenant_id");
        tenantIdClaim.Should().NotBeNull();
        tenantIdClaim!.Value.Should().NotBeNullOrEmpty();
        Guid.TryParse(tenantIdClaim.Value, out _).Should().BeTrue();
    }

    // Fix #10: Missing coverage tests

    [Fact]
    public async Task Accept_NewUser_AsTrainer_CreatesStaffWithTrainerType()
    {
        var (token, gymHouseId, _) = await CreateValidInvitationAsync("trainer@example.com", Role.Trainer);

        var result = await Sender.Send(new AcceptInvitationCommand(token, "Password123!", "Trainer User"));

        result.IsSuccess.Should().BeTrue();

        var staff = await DbContext.Staff
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.User.Email == "trainer@example.com" && s.GymHouseId == gymHouseId);
        staff.Should().NotBeNull();
        staff!.StaffType.Should().Be(StaffType.Trainer);
    }

    [Fact]
    public async Task Accept_NewUser_AsStaff_CreatesStaffWithReceptionType()
    {
        var (token, gymHouseId, _) = await CreateValidInvitationAsync("reception@example.com", Role.Staff);

        var result = await Sender.Send(new AcceptInvitationCommand(token, "Password123!", "Reception User"));

        result.IsSuccess.Should().BeTrue();

        var staff = await DbContext.Staff
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.User.Email == "reception@example.com" && s.GymHouseId == gymHouseId);
        staff.Should().NotBeNull();
        staff!.StaffType.Should().Be(StaffType.Reception);
    }

    [Fact]
    public async Task Accept_NewUser_NullPassword_ReturnsFailure()
    {
        var (token, _, _) = await CreateValidInvitationAsync("nopw@example.com", Role.Staff);

        var result = await Sender.Send(new AcceptInvitationCommand(token, null, "Some Name"));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Password");
    }

    [Fact]
    public async Task Accept_NewUser_NullFullName_ReturnsFailure()
    {
        var (token, _, _) = await CreateValidInvitationAsync("noname@example.com", Role.Staff);

        var result = await Sender.Send(new AcceptInvitationCommand(token, "Password123!", null));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Full name");
    }

    [Fact]
    public async Task Accept_ExistingUser_AlreadyMemberOfGym_SkipsCreation()
    {
        var (owner, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Skip Member Gym");
        var (existingUser, _) = await CreateMemberAsync(gymHouse.Id, $"alreadymember{Guid.NewGuid()}@example.com");

        // Insert a pending invitation directly (bypassing the duplicate-pending unique index issue
        // that would arise if we used CreateInvitationCommand for an already-existing member).
        var invitation = new InvitationBuilder()
            .WithTenantId(owner.Id)
            .WithEmail(existingUser.Email)
            .WithRole(Role.Member)
            .WithGymHouseId(gymHouse.Id)
            .WithToken("skip-member-token-aaaaaaaaaaaaaaaaaaaaaaaaa")
            .WithExpiresAt(DateTime.UtcNow.AddHours(48))
            .WithCreatedBy(owner.Id)
            .Build();

        DbContext.Set<GymManager.Domain.Entities.Invitation>().Add(invitation);
        await DbContext.SaveChangesAsync();

        var memberCountBefore = await DbContext.Members
            .AsNoTracking()
            .CountAsync(m => m.UserId == existingUser.Id && m.GymHouseId == gymHouse.Id);

        // The existing user provides their password to verify identity (Fix #7)
        var result = await Sender.Send(new AcceptInvitationCommand(
            "skip-member-token-aaaaaaaaaaaaaaaaaaaaaaaaa", "Test@1234", null));

        result.IsSuccess.Should().BeTrue();

        var memberCountAfter = await DbContext.Members
            .AsNoTracking()
            .CountAsync(m => m.UserId == existingUser.Id && m.GymHouseId == gymHouse.Id);

        memberCountAfter.Should().Be(memberCountBefore, "existing member should not be duplicated");
    }

    [Fact]
    public async Task Accept_ExistingUser_AlreadyStaffOfGym_SkipsCreation()
    {
        var (owner, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Skip Staff Gym");
        var (existingUser, _) = await CreateMemberAsync(gymHouse.Id, $"alreadystaff{Guid.NewGuid()}@example.com");

        // Add the user as staff directly
        var staffRecord = new GymManager.Domain.Entities.Staff
        {
            UserId = existingUser.Id,
            GymHouseId = gymHouse.Id,
            StaffType = StaffType.Reception,
            BaseSalary = 0m,
            PerClassBonus = 0m
        };
        DbContext.Staff.Add(staffRecord);
        await DbContext.SaveChangesAsync();

        // Invite again as Staff to same gym
        var invitation = new InvitationBuilder()
            .WithTenantId(owner.Id)
            .WithEmail(existingUser.Email)
            .WithRole(Role.Staff)
            .WithGymHouseId(gymHouse.Id)
            .WithToken("skip-staff-token-aaaaaaaaaaaaaaaaaaaaaaaaa")
            .WithExpiresAt(DateTime.UtcNow.AddHours(48))
            .WithCreatedBy(owner.Id)
            .Build();

        DbContext.Set<GymManager.Domain.Entities.Invitation>().Add(invitation);
        await DbContext.SaveChangesAsync();

        var staffCountBefore = await DbContext.Staff
            .AsNoTracking()
            .CountAsync(s => s.UserId == existingUser.Id && s.GymHouseId == gymHouse.Id);

        var result = await Sender.Send(new AcceptInvitationCommand(
            "skip-staff-token-aaaaaaaaaaaaaaaaaaaaaaaaa", "Test@1234", null));

        result.IsSuccess.Should().BeTrue();

        var staffCountAfter = await DbContext.Staff
            .AsNoTracking()
            .CountAsync(s => s.UserId == existingUser.Id && s.GymHouseId == gymHouse.Id);

        staffCountAfter.Should().Be(staffCountBefore, "existing staff should not be duplicated");
    }

    // Fix #7: existing-user password verification tests

    [Fact]
    public async Task Accept_ExistingUser_WithoutPassword_ReturnsFailure()
    {
        var (_, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Auth Verify Gym");
        var (existingUser, _) = await CreateMemberAsync(gymHouse.Id, $"verify{Guid.NewGuid()}@example.com");

        var (_, gymHouse2) = await CreateOwnerAsync($"owner2{Guid.NewGuid()}@test.com", "Second Auth Gym");
        var createResult = await Sender.Send(new CreateInvitationCommand(existingUser.Email, Role.Staff, gymHouse2.Id));
        createResult.IsSuccess.Should().BeTrue();

        var result = await Sender.Send(new AcceptInvitationCommand(createResult.Value.Token, null, null));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Password");
    }

    [Fact]
    public async Task Accept_ExistingUser_WithWrongPassword_ReturnsFailure()
    {
        var (_, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Wrong PW Gym");
        var (existingUser, _) = await CreateMemberAsync(gymHouse.Id, $"wrongpw{Guid.NewGuid()}@example.com");

        var (_, gymHouse2) = await CreateOwnerAsync($"owner2{Guid.NewGuid()}@test.com", "Second WP Gym");
        var createResult = await Sender.Send(new CreateInvitationCommand(existingUser.Email, Role.Staff, gymHouse2.Id));
        createResult.IsSuccess.Should().BeTrue();

        var result = await Sender.Send(new AcceptInvitationCommand(createResult.Value.Token, "WrongPassword123!", null));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Invalid credentials");
    }

    [Fact]
    public async Task Accept_ExistingUser_WithCorrectPassword_Succeeds()
    {
        var (_, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Correct PW Gym");
        var (existingUser, _) = await CreateMemberAsync(gymHouse.Id, $"correctpw{Guid.NewGuid()}@example.com");

        var (_, gymHouse2) = await CreateOwnerAsync($"owner2{Guid.NewGuid()}@test.com", "Second CP Gym");
        var createResult = await Sender.Send(new CreateInvitationCommand(existingUser.Email, Role.Staff, gymHouse2.Id));
        createResult.IsSuccess.Should().BeTrue();

        // CreateMemberAsync uses "Test@1234" as the password hash (BCrypt)
        var result = await Sender.Send(new AcceptInvitationCommand(createResult.Value.Token, "Test@1234", null));

        result.IsSuccess.Should().BeTrue();
        result.Value.UserId.Should().Be(existingUser.Id);
    }
}
