using FluentAssertions;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.GymHouses;

public sealed class CreateGymHouseCommandHandlerTests : ApplicationTestBase
{
    [Fact]
    public async Task CreateGymHouse_WithManageTenantPermission_Succeeds()
    {
        var (owner, _) = await CreateOwnerAsync("gymowner@example.com");

        var command = new CreateGymHouseCommand("Elite Gym", "456 Fitness Ave", null, null, 100);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Name.Should().Be("Elite Gym");
        result.Value.OwnerId.Should().Be(owner.Id);
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
