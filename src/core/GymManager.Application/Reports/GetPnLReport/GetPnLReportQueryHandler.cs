using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Reports.GetPnLReport;

public sealed class GetPnLReportQueryHandler(
    ITransactionRepository transactionRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetPnLReportQuery, Result<PnLReportDto>>
{
    public async Task<Result<PnLReportDto>> Handle(GetPnLReportQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewReports, ct);
        if (!canView)
            return Result.Failure<PnLReportDto>(new ForbiddenError().ToString());

        var aggregates = await transactionRepository.GetAggregateByDirectionAndCategoryAsync(
            request.GymHouseId, request.From, request.To, ct);

        var incomeLines = aggregates
            .Where(a => a.Direction == TransactionDirection.Credit)
            .Select(a => new PnLLineDto(a.Category, a.Total))
            .OrderBy(l => l.Category)
            .ToList();

        var expenseLines = aggregates
            .Where(a => a.Direction == TransactionDirection.Debit)
            .Select(a => new PnLLineDto(a.Category, a.Total))
            .OrderBy(l => l.Category)
            .ToList();

        var totalIncome = incomeLines.Sum(l => l.TotalAmount);
        var totalExpense = expenseLines.Sum(l => l.TotalAmount);
        var netProfit = totalIncome - totalExpense;

        return Result.Success(new PnLReportDto(
            request.GymHouseId,
            request.From,
            request.To,
            incomeLines,
            expenseLines,
            totalIncome,
            totalExpense,
            netProfit));
    }
}
