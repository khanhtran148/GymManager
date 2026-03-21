using FluentAssertions;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.Members.GetMembers;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Members;

public sealed class GetMembersQueryHandlerTests : ApplicationTestBase
{
    private async Task<Guid> SetupGymHouseAsync()
    {
        var (_, gymHouse) = await CreateOwnerAsync(
            $"owner{Guid.NewGuid()}@example.com", "Members Gym");
        return gymHouse.Id;
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

        var (_, gymHouse2) = await CreateOwnerAsync($"owner2{Guid.NewGuid()}@example.com", "Second Gym");
        await Sender.Send(new CreateMemberCommand(gymHouse2.Id, "house2member@example.com", "House 2 Member", null));

        var result = await Sender.Send(new GetMembersQuery(gymHouseId1, 1, 20));

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(1);
        result.Value.Items[0].Email.Should().Be("house1member@example.com");
    }
}
