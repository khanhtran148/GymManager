using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Reports.GetRevenueMetrics;

public sealed class GetRevenueMetricsQueryHandler(
    ITransactionRepository transactionRepository,
    ISubscriptionRepository subscriptionRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetRevenueMetricsQuery, Result<RevenueMetricsDto>>
{
    public async Task<Result<RevenueMetricsDto>> Handle(GetRevenueMetricsQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewReports, ct);
        if (!canView)
            return Result.Failure<RevenueMetricsDto>(new ForbiddenError().ToString());

        var totalRevenue = await transactionRepository.GetRevenueAggregateAsync(
            request.GymHouseId, request.From, request.To, ct);

        var activeMembers = await subscriptionRepository.GetActiveCountByGymHouseAsync(request.GymHouseId, ct);

        var cancelledSubscriptions = await subscriptionRepository.GetCancelledCountByGymHouseAsync(
            request.GymHouseId, request.From, request.To, ct);

        // MRR: total revenue divided by number of months in range (at least 1)
        var months = Math.Max(1,
            (int)Math.Ceiling((request.To - request.From).TotalDays / 30.0));
        var mrr = months > 0 ? totalRevenue / months : 0;

        // Churn rate: cancelled / (active + cancelled) expressed as percentage
        var totalSubscriptions = activeMembers + cancelledSubscriptions;
        var churnRate = totalSubscriptions > 0
            ? (decimal)cancelledSubscriptions / totalSubscriptions * 100m
            : 0m;

        var avgRevenuePerMember = activeMembers > 0 ? totalRevenue / activeMembers : 0m;

        return Result.Success(new RevenueMetricsDto(
            request.GymHouseId,
            request.From,
            request.To,
            Math.Round(mrr, 2),
            Math.Round(churnRate, 2),
            Math.Round(avgRevenuePerMember, 2),
            totalRevenue,
            activeMembers,
            cancelledSubscriptions));
    }
}
