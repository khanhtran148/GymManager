using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.Subscriptions.CancelSubscription;
using GymManager.Application.Subscriptions.CreateSubscription;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Subscriptions;

public sealed class CancelSubscriptionCommandHandlerTests : ApplicationTestBase
{
    private async Task<(Guid GymHouseId, Guid SubscriptionId)> SetupActiveSubscriptionAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var house = await Sender.Send(new CreateGymHouseCommand("Cancel Gym", "20 Cancel St", null, null, 50));
        var member = await Sender.Send(new CreateMemberCommand(house.Value.Id, "cancelmember@example.com", "Cancel Member", null));

        var sub = await Sender.Send(new CreateSubscriptionCommand(
            member.Value.Id, house.Value.Id, SubscriptionType.Monthly, 100m,
            DateTime.UtcNow, DateTime.UtcNow.AddMonths(1)));

        return (house.Value.Id, sub.Value.Id);
    }

    [Fact]
    public async Task Cancel_ActiveSubscription_Succeeds()
    {
        var (gymHouseId, subId) = await SetupActiveSubscriptionAsync();

        var result = await Sender.Send(new CancelSubscriptionCommand(subId, gymHouseId));

        result.IsSuccess.Should().BeTrue();
        result.Value.Status.Should().Be(SubscriptionStatus.Cancelled);
    }

    [Fact]
    public async Task Cancel_AlreadyCancelledSubscription_Fails()
    {
        var (gymHouseId, subId) = await SetupActiveSubscriptionAsync();
        await Sender.Send(new CancelSubscriptionCommand(subId, gymHouseId));

        var result = await Sender.Send(new CancelSubscriptionCommand(subId, gymHouseId));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("already cancelled");
    }

    [Fact]
    public async Task Cancel_WithoutPermission_Fails()
    {
        var (gymHouseId, subId) = await SetupActiveSubscriptionAsync();
        CurrentUser.Permissions = Permission.ViewSubscriptions; // No ManageSubscriptions

        var result = await Sender.Send(new CancelSubscriptionCommand(subId, gymHouseId));

        result.IsFailure.Should().BeTrue();
    }
}
