using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.Subscriptions.CancelSubscription;
using GymManager.Application.Subscriptions.CreateSubscription;
using GymManager.Application.Subscriptions.FreezeSubscription;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Subscriptions;

public sealed class FreezeSubscriptionCommandHandlerTests : ApplicationTestBase
{
    private async Task<(Guid GymHouseId, Guid SubscriptionId)> SetupActiveSubscriptionAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var house = await Sender.Send(new CreateGymHouseCommand("Freeze Gym", "10 Freeze St", null, null, 50));
        var member = await Sender.Send(new CreateMemberCommand(house.Value.Id, "freezemember@example.com", "Freeze Member", null));

        var sub = await Sender.Send(new CreateSubscriptionCommand(
            member.Value.Id, house.Value.Id, SubscriptionType.Monthly, 100m,
            DateTime.UtcNow, DateTime.UtcNow.AddMonths(1)));

        return (house.Value.Id, sub.Value.Id);
    }

    [Fact]
    public async Task Freeze_ActiveSubscription_Succeeds()
    {
        var (gymHouseId, subId) = await SetupActiveSubscriptionAsync();
        var until = DateTime.UtcNow.AddDays(14);

        var result = await Sender.Send(new FreezeSubscriptionCommand(subId, gymHouseId, until));

        result.IsSuccess.Should().BeTrue();
        result.Value.Status.Should().Be(SubscriptionStatus.Frozen);
        result.Value.FrozenUntil.Should().BeCloseTo(until, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task Freeze_AlreadyFrozenSubscription_Fails()
    {
        var (gymHouseId, subId) = await SetupActiveSubscriptionAsync();
        await Sender.Send(new FreezeSubscriptionCommand(subId, gymHouseId, DateTime.UtcNow.AddDays(14)));

        var result = await Sender.Send(new FreezeSubscriptionCommand(subId, gymHouseId, DateTime.UtcNow.AddDays(20)));

        result.IsFailure.Should().BeTrue();
    }

    [Fact]
    public async Task Freeze_CancelledSubscription_Fails()
    {
        var (gymHouseId, subId) = await SetupActiveSubscriptionAsync();
        await Sender.Send(new CancelSubscriptionCommand(subId, gymHouseId));

        var result = await Sender.Send(new FreezeSubscriptionCommand(subId, gymHouseId, DateTime.UtcNow.AddDays(14)));

        result.IsFailure.Should().BeTrue();
    }
}
