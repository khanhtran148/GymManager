using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.GymHouses;

public sealed class CreateGymHouseCommandHandlerTests : ApplicationTestBase
{
    [Fact]
    public async Task CreateGymHouse_WithManageTenantPermission_Succeeds()
    {
        var reg = await Sender.Send(new RegisterCommand("gymowner@example.com", "Password123!", "Gym Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var command = new CreateGymHouseCommand("Elite Gym", "456 Fitness Ave", null, null, 100);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Name.Should().Be("Elite Gym");
        result.Value.OwnerId.Should().Be(reg.Value.UserId);
    }

    [Fact]
    public async Task CreateGymHouse_WithoutManageTenantPermission_Fails()
    {
        CurrentUser.Permissions = Permission.ViewMembers; // No ManageTenant

        var command = new CreateGymHouseCommand("Gym", "Address", null, null, 10);

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }
}
