using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.Subscriptions.CreateSubscription;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Subscriptions;

public sealed class CreateSubscriptionCommandHandlerTests : ApplicationTestBase
{
    private async Task<(Guid GymHouseId, Guid MemberId)> SetupAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var house = await Sender.Send(new CreateGymHouseCommand("Sub Gym", "100 Sub St", null, null, 50));
        var member = await Sender.Send(new CreateMemberCommand(house.Value.Id, "submember@example.com", "Sub Member", null));
        return (house.Value.Id, member.Value.Id);
    }

    [Fact]
    public async Task CreateSubscription_WithManagePermission_Succeeds()
    {
        var (gymHouseId, memberId) = await SetupAsync();
        var start = DateTime.UtcNow;
        var end = start.AddMonths(1);

        var command = new CreateSubscriptionCommand(memberId, gymHouseId, SubscriptionType.Monthly, 100m, start, end);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Status.Should().Be(SubscriptionStatus.Active);
        result.Value.Price.Should().Be(100m);
    }

    [Fact]
    public async Task CreateSubscription_WhenActiveSubscriptionExists_Fails()
    {
        var (gymHouseId, memberId) = await SetupAsync();
        var start = DateTime.UtcNow;
        var end = start.AddMonths(1);

        await Sender.Send(new CreateSubscriptionCommand(memberId, gymHouseId, SubscriptionType.Monthly, 100m, start, end));

        var result = await Sender.Send(new CreateSubscriptionCommand(memberId, gymHouseId, SubscriptionType.Monthly, 100m, start, end));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("already has an active subscription");
    }
}
