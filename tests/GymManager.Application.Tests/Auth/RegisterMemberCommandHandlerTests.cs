using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using System.IdentityModel.Tokens.Jwt;
using Xunit;

namespace GymManager.Application.Tests.Auth;

public sealed class RegisterMemberCommandHandlerTests : ApplicationTestBase
{
    [Fact]
    public async Task Register_WithValidGymHouseId_CreatesMemberUser()
    {
        var (_, gymHouse) = await CreateOwnerAsync("owner@register-member.com", "Member Register Gym");

        var command = new RegisterCommand(
            "newmember@example.com", "Password123!", "New Member", null, gymHouse.Id);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.UserId.Should().NotBeEmpty();

        var userRepo = Services.GetRequiredService<IUserRepository>();
        var user = await userRepo.GetByIdAsync(result.Value.UserId);
        user.Should().NotBeNull();
        user!.Role.Should().Be(Role.Member);

        var memberRepo = Services.GetRequiredService<IMemberRepository>();
        var members = await memberRepo.GetByGymHouseIdAsync(gymHouse.Id, 1, 10, null);
        members.Items.Should().Contain(m => m.UserId == result.Value.UserId);
    }

    [Fact]
    public async Task Register_WithValidGymHouseId_SeedsRolePermissions()
    {
        var (owner, gymHouse) = await CreateOwnerAsync("owner@register-seed.com", "Seed Perm Gym");

        var command = new RegisterCommand(
            "seeded-member@example.com", "Password123!", "Seeded Member", null, gymHouse.Id);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();

        var rolePermRepo = Services.GetRequiredService<IRolePermissionRepository>();
        var exists = await rolePermRepo.ExistsForTenantAsync(owner.Id);
        exists.Should().BeTrue();

        var memberPerms = await rolePermRepo.GetByTenantAndRoleAsync(owner.Id, Role.Member);
        memberPerms.Should().NotBeNull();
        memberPerms!.Permissions.Should().NotBe(Permission.None);
    }

    [Fact]
    public async Task Register_WithInvalidGymHouseId_ReturnsBadRequest()
    {
        var command = new RegisterCommand(
            "no-gym@example.com", "Password123!", "No Gym", null, Guid.NewGuid());

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task Register_ReturnsJwtWithTenantIdClaim()
    {
        var (owner, gymHouse) = await CreateOwnerAsync("owner@register-jwt.com", "JWT Claim Gym");

        var command = new RegisterCommand(
            "jwt-member@example.com", "Password123!", "JWT Member", null, gymHouse.Id);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();

        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(result.Value.AccessToken);

        var tenantIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "tenant_id");
        tenantIdClaim.Should().NotBeNull("JWT must contain tenant_id claim");
        tenantIdClaim!.Value.Should().Be(owner.Id.ToString());
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsConflict()
    {
        var (_, gymHouse) = await CreateOwnerAsync("owner@register-dupe.com", "Dupe Email Gym");

        var command = new RegisterCommand(
            "duplicate-member@example.com", "Password123!", "First Member", null, gymHouse.Id);

        await Sender.Send(command);

        var duplicate = new RegisterCommand(
            "duplicate-member@example.com", "Password123!", "Second Member", null, gymHouse.Id);

        var result = await Sender.Send(duplicate);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("already registered");
    }
}
