using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.Reports.GetRevenueMetrics;
using GymManager.Application.Subscriptions.CancelSubscription;
using GymManager.Application.Subscriptions.CreateSubscription;
using GymManager.Application.Transactions.RecordTransaction;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Reports;

public sealed class GetRevenueMetricsQueryHandlerTests : ApplicationTestBase
{
    private async Task<(Guid OwnerId, Guid GymHouseId)> SetupOwnerAndHouseAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123!", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var house = await Sender.Send(new CreateGymHouseCommand("Finance Gym", "123 Test St", null, null, 50));
        return (reg.Value.UserId, house.Value.Id);
    }

    [Fact]
    public async Task GetRevenueMetrics_WithRevenue_CalculatesMrr()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var from = DateTime.UtcNow.AddDays(-30);
        var to = DateTime.UtcNow.AddDays(1);

        await Sender.Send(new RecordTransactionCommand(
            gymHouseId, TransactionType.MembershipFee, TransactionDirection.Credit,
            300m, TransactionCategory.Revenue, "Fee", DateTime.UtcNow,
            null, null, null, null));

        var result = await Sender.Send(new GetRevenueMetricsQuery(gymHouseId, from, to));

        result.IsSuccess.Should().BeTrue();
        result.Value.TotalRevenue.Should().Be(300m);
        result.Value.Mrr.Should().BeGreaterThan(0);
        result.Value.GymHouseId.Should().Be(gymHouseId);
    }

    [Fact]
    public async Task GetRevenueMetrics_WithCancelledSubscriptions_CalculatesChurnRate()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var from = DateTime.UtcNow.AddDays(-30);
        var to = DateTime.UtcNow.AddDays(1);

        var memberResult = await Sender.Send(new CreateMemberCommand(gymHouseId, $"m{Guid.NewGuid()}@example.com", "Member One", null));
        var subResult = await Sender.Send(new CreateSubscriptionCommand(
            memberResult.Value.Id, gymHouseId, SubscriptionType.Monthly, 100m,
            DateTime.UtcNow, DateTime.UtcNow.AddMonths(1)));

        await Sender.Send(new CancelSubscriptionCommand(subResult.Value.Id, gymHouseId));

        var result = await Sender.Send(new GetRevenueMetricsQuery(gymHouseId, from, to));

        result.IsSuccess.Should().BeTrue();
        result.Value.CancelledSubscriptions.Should().BeGreaterThan(0);
        result.Value.ChurnRate.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetRevenueMetrics_WithoutViewReportsPermission_ReturnsForbidden()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        CurrentUser.Permissions = Permission.ViewFinance;

        var result = await Sender.Send(new GetRevenueMetricsQuery(gymHouseId, DateTime.UtcNow.AddDays(-30), DateTime.UtcNow));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }

    [Fact]
    public async Task GetRevenueMetrics_NoData_ReturnsZeros()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var from = DateTime.UtcNow.AddDays(-30);
        var to = DateTime.UtcNow.AddDays(1);

        var result = await Sender.Send(new GetRevenueMetricsQuery(gymHouseId, from, to));

        result.IsSuccess.Should().BeTrue();
        result.Value.TotalRevenue.Should().Be(0m);
        result.Value.ChurnRate.Should().Be(0m);
        result.Value.AvgRevenuePerMember.Should().Be(0m);
    }

    [Fact]
    public async Task GetRevenueMetrics_WithActiveMembers_CalculatesAvgRevPerMember()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var from = DateTime.UtcNow.AddDays(-30);
        var to = DateTime.UtcNow.AddDays(1);

        // Create 2 members with active subscriptions
        for (var i = 0; i < 2; i++)
        {
            var memberResult = await Sender.Send(new CreateMemberCommand(
                gymHouseId, $"member{Guid.NewGuid()}@example.com", $"Member {i}", null));
            await Sender.Send(new CreateSubscriptionCommand(
                memberResult.Value.Id, gymHouseId, SubscriptionType.Monthly, 100m,
                DateTime.UtcNow, DateTime.UtcNow.AddMonths(1)));
        }

        await Sender.Send(new RecordTransactionCommand(
            gymHouseId, TransactionType.MembershipFee, TransactionDirection.Credit,
            200m, TransactionCategory.Revenue, "Combined fees", DateTime.UtcNow,
            null, null, null, null));

        var result = await Sender.Send(new GetRevenueMetricsQuery(gymHouseId, from, to));

        result.IsSuccess.Should().BeTrue();
        result.Value.ActiveMembers.Should().Be(2);
        result.Value.AvgRevenuePerMember.Should().Be(100m);
    }
}
