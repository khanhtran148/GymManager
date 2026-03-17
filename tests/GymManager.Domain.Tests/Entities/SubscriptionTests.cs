using FluentAssertions;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Domain.Tests.Entities;

public sealed class SubscriptionTests
{
    private static Subscription BuildActive() => new()
    {
        MemberId = Guid.NewGuid(),
        GymHouseId = Guid.NewGuid(),
        Type = SubscriptionType.Monthly,
        Status = SubscriptionStatus.Active,
        Price = 100m,
        StartDate = DateTime.UtcNow,
        EndDate = DateTime.UtcNow.AddMonths(1)
    };

    [Fact]
    public void Freeze_ActiveSubscription_Succeeds()
    {
        var sub = BuildActive();
        var until = DateTime.UtcNow.AddDays(14);

        var result = sub.Freeze(until);

        result.IsSuccess.Should().BeTrue();
        sub.Status.Should().Be(SubscriptionStatus.Frozen);
        sub.FrozenAt.Should().NotBeNull();
        sub.FrozenUntil.Should().Be(until);
    }

    [Theory]
    [InlineData(SubscriptionStatus.Frozen)]
    [InlineData(SubscriptionStatus.Expired)]
    [InlineData(SubscriptionStatus.Cancelled)]
    public void Freeze_NonActiveSubscription_Fails(SubscriptionStatus status)
    {
        var sub = BuildActive();
        sub.Status = status;

        var result = sub.Freeze(DateTime.UtcNow.AddDays(7));

        result.IsFailure.Should().BeTrue();
    }

    [Fact]
    public void Cancel_ActiveSubscription_Succeeds()
    {
        var sub = BuildActive();

        var result = sub.Cancel();

        result.IsSuccess.Should().BeTrue();
        sub.Status.Should().Be(SubscriptionStatus.Cancelled);
    }

    [Fact]
    public void Cancel_AlreadyCancelled_Fails()
    {
        var sub = BuildActive();
        sub.Status = SubscriptionStatus.Cancelled;

        var result = sub.Cancel();

        result.IsFailure.Should().BeTrue();
    }

    [Theory]
    [InlineData(SubscriptionStatus.Active)]
    [InlineData(SubscriptionStatus.Frozen)]
    public void Expire_ActiveOrFrozenSubscription_Succeeds(SubscriptionStatus status)
    {
        var sub = BuildActive();
        sub.Status = status;

        var result = sub.Expire();

        result.IsSuccess.Should().BeTrue();
        sub.Status.Should().Be(SubscriptionStatus.Expired);
    }

    [Theory]
    [InlineData(SubscriptionStatus.Expired)]
    [InlineData(SubscriptionStatus.Cancelled)]
    public void Expire_InvalidStatus_Fails(SubscriptionStatus status)
    {
        var sub = BuildActive();
        sub.Status = status;

        var result = sub.Expire();

        result.IsFailure.Should().BeTrue();
    }

    [Fact]
    public void Renew_WithValidDates_Succeeds()
    {
        var sub = BuildActive();
        sub.Status = SubscriptionStatus.Expired;
        var start = DateTime.UtcNow;
        var end = start.AddMonths(1);

        var result = sub.Renew(start, end, 120m);

        result.IsSuccess.Should().BeTrue();
        sub.Status.Should().Be(SubscriptionStatus.Active);
        sub.Price.Should().Be(120m);
        sub.FrozenAt.Should().BeNull();
        sub.FrozenUntil.Should().BeNull();
    }

    [Fact]
    public void Renew_WithEndBeforeStart_Fails()
    {
        var sub = BuildActive();
        var start = DateTime.UtcNow;
        var end = start.AddDays(-1);

        var result = sub.Renew(start, end, 100m);

        result.IsFailure.Should().BeTrue();
    }
}
