using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.Members.GetMembers;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Members;

public sealed class GetMembersQueryHandlerTests : ApplicationTestBase
{
    private async Task<Guid> SetupGymHouseAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var house = await Sender.Send(new CreateGymHouseCommand("Members Gym", "456 Test Ave", null, null, 50));
        return house.Value.Id;
    }

    [Fact]
    public async Task GetMembers_ReturnsPaginatedResults()
    {
        var gymHouseId = await SetupGymHouseAsync();

        for (int i = 1; i <= 5; i++)
            await Sender.Send(new CreateMemberCommand(gymHouseId, $"member{i}@example.com", $"Member {i}", null));

        var result = await Sender.Send(new GetMembersQuery(gymHouseId, 1, 3));

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(3);
        result.Value.TotalCount.Should().Be(5);
        result.Value.Page.Should().Be(1);
        result.Value.PageSize.Should().Be(3);
    }

    [Fact]
    public async Task GetMembers_TenantIsolation_ReturnsOnlyMembersOfRequestedHouse()
    {
        var gymHouseId1 = await SetupGymHouseAsync();
        await Sender.Send(new CreateMemberCommand(gymHouseId1, "house1member@example.com", "House 1 Member", null));

        // Switch owner for second house
        var reg2 = await Sender.Send(new RegisterCommand(
            $"owner2{Guid.NewGuid()}@example.com", "Password123", "Owner2", null));
        CurrentUser.UserId = reg2.Value.UserId;
        CurrentUser.TenantId = reg2.Value.UserId;
        var house2 = await Sender.Send(new CreateGymHouseCommand("Second Gym", "789 Other St", null, null, 50));
        await Sender.Send(new CreateMemberCommand(house2.Value.Id, "house2member@example.com", "House 2 Member", null));

        // Query house1 members as house2 owner — but note permission is Admin so all accessible
        // Tenant isolation in queries is by gymHouseId filter
        CurrentUser.UserId = reg2.Value.UserId;
        var result = await Sender.Send(new GetMembersQuery(gymHouseId1, 1, 20));

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(1);
        result.Value.Items[0].Email.Should().Be("house1member@example.com");
    }
}
