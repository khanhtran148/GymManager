namespace GymManager.Application.Reports.GetRevenueMetrics;

public sealed record RevenueMetricsDto(
    Guid GymHouseId,
    DateTime From,
    DateTime To,
    decimal Mrr,
    decimal ChurnRate,
    decimal AvgRevenuePerMember,
    decimal TotalRevenue,
    int ActiveMembers,
    int CancelledSubscriptions);
