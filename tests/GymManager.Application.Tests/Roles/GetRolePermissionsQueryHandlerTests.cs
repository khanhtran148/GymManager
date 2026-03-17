using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Roles.GetRolePermissions;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Roles;

public sealed class GetRolePermissionsQueryHandlerTests : ApplicationTestBase
{
    private async Task SetupOwnerAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123!", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;
        CurrentUser.Role = Role.Owner;
    }

    [Fact]
    public async Task GetRolePermissions_AsOwner_ReturnsAllFiveRoles()
    {
        await SetupOwnerAsync();

        var result = await Sender.Send(new GetRolePermissionsQuery());

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(5);
        result.Value.Select(r => r.Role).Should().Contain(["Owner", "HouseManager", "Trainer", "Staff", "Member"]);
    }

    [Fact]
    public async Task GetRolePermissions_SeedsDefaultsOnFirstAccess()
    {
        await SetupOwnerAsync();

        // First call — no existing rows, should seed defaults
        var result = await Sender.Send(new GetRolePermissionsQuery());

        result.IsSuccess.Should().BeTrue();
        var ownerDto = result.Value.Single(r => r.Role == "Owner");
        ownerDto.Permissions.Should().Be(((long)Permission.Admin).ToString());
        ownerDto.PermissionNames.Should().Contain("Admin");
    }

    [Fact]
    public async Task GetRolePermissions_AsNonOwner_ReturnsForbidden()
    {
        await SetupOwnerAsync();
        CurrentUser.Role = Role.Trainer;

        var result = await Sender.Send(new GetRolePermissionsQuery());

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }
}
