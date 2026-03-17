using CSharpFunctionalExtensions;
using MediatR;

namespace GymManager.Application.Reports.GetPnLReport;

public sealed record GetPnLReportQuery(
    Guid GymHouseId,
    DateTime From,
    DateTime To) : IRequest<Result<PnLReportDto>>;
