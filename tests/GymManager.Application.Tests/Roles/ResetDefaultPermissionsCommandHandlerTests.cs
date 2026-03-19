using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Roles.GetRolePermissions;
using GymManager.Application.Roles.ResetDefaultPermissions;
using GymManager.Application.Roles.UpdateRolePermissions;
using GymManager.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GymManager.Application.Tests.Roles;

public sealed class ResetDefaultPermissionsCommandHandlerTests : ApplicationTestBase
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
    public async Task ResetDefaults_AsOwner_Succeeds()
    {
        await SetupOwnerAsync();

        var result = await Sender.Send(new ResetDefaultPermissionsCommand());

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task ResetDefaults_AsNonOwner_ReturnsForbidden()
    {
        await SetupOwnerAsync();
        CurrentUser.Role = Role.HouseManager;
        CurrentUser.Permissions = Permission.ViewMembers | Permission.ManageMembers;

        var result = await Sender.Send(new ResetDefaultPermissionsCommand());

        result.IsFailure.Should().BeTrue();
    }

    [Fact]
    public async Task ResetDefaults_RestoresCustomizedPermissionsToDefaults()
    {
        await SetupOwnerAsync();

        // First customize Trainer permissions
        var customBitmask = ((long)Permission.ViewMembers).ToString();
        await Sender.Send(new UpdateRolePermissionsCommand(Role.Trainer, customBitmask));

        // Now reset to defaults
        await Sender.Send(new ResetDefaultPermissionsCommand());

        // Verify Trainer has default permissions restored
        var getResult = await Sender.Send(new GetRolePermissionsQuery());
        var trainerDto = getResult.Value.Single(r => r.Role == "Trainer");
        var expectedTrainerBits = (long)(Permission.ViewMembers | Permission.ViewSubscriptions |
            Permission.ViewClasses | Permission.ViewBookings | Permission.ManageBookings |
            Permission.ViewSchedule | Permission.ViewAnnouncements);
        trainerDto.Permissions.Should().Be(expectedTrainerBits.ToString());
    }
}
