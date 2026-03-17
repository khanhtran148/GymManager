using FluentAssertions;
using GymManager.Application.Auth.Register;
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
        var reg = await Sender.Send(new RegisterCommand("gethouseowner@example.com", "Password123", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        await Sender.Send(new CreateGymHouseCommand("House A", "Address A", null, null, 20));
        await Sender.Send(new CreateGymHouseCommand("House B", "Address B", null, null, 30));

        var result = await Sender.Send(new GetGymHousesQuery());

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(2);
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
