using FluentAssertions;
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
        var (_, gymHouse) = await CreateOwnerAsync(
            $"owner{Guid.NewGuid()}@example.com", "Cancel Sub Test Gym");
        var member = await Sender.Send(new CreateMemberCommand(gymHouse.Id, "cancelmember@example.com", "Cancel Member", null));

        var sub = await Sender.Send(new CreateSubscriptionCommand(
            member.Value.Id, gymHouse.Id, SubscriptionType.Monthly, 100m,
            DateTime.UtcNow, DateTime.UtcNow.AddMonths(1)));

        return (gymHouse.Id, sub.Value.Id);
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
