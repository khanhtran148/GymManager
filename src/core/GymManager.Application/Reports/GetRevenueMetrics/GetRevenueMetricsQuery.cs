using CSharpFunctionalExtensions;
using MediatR;

namespace GymManager.Application.Reports.GetRevenueMetrics;

public sealed record GetRevenueMetricsQuery(
    Guid GymHouseId,
    DateTime From,
    DateTime To) : IRequest<Result<RevenueMetricsDto>>;
