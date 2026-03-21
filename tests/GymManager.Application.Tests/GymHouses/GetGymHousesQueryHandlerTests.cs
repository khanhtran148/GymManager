using FluentAssertions;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.GymHouses.GetGymHouses;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.GymHouses;

public sealed class GetGymHousesQueryHandlerTests : ApplicationTestBase
{
    [Fact]
    public async Task GetGymHouses_ReturnsHousesForCurrentOwner()
    {
        await CreateOwnerAsync("gethouseowner@example.com", "Get House Gym");

        await Sender.Send(new CreateGymHouseCommand("House A", "Address A", null, null, 20));
        await Sender.Send(new CreateGymHouseCommand("House B", "Address B", null, null, 30));

        var result = await Sender.Send(new GetGymHousesQuery());

        result.IsSuccess.Should().BeTrue();
        result.Value.Count.Should().BeGreaterThanOrEqualTo(2);
        result.Value.Should().Contain(h => h.Name == "House A");
        result.Value.Should().Contain(h => h.Name == "House B");
    }

    [Fact]
    public async Task GetGymHouses_WithoutViewPermission_Fails()
    {
        CurrentUser.Permissions = Permission.None;

        var result = await Sender.Send(new GetGymHousesQuery());

        result.IsFailure.Should().BeTrue();
    }
}
