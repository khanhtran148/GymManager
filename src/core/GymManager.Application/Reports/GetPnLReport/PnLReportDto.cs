using GymManager.Domain.Enums;

namespace GymManager.Application.Reports.GetPnLReport;

public sealed record PnLReportDto(
    Guid GymHouseId,
    DateTime From,
    DateTime To,
    IReadOnlyList<PnLLineDto> IncomeLines,
    IReadOnlyList<PnLLineDto> ExpenseLines,
    decimal TotalIncome,
    decimal TotalExpense,
    decimal NetProfit);

public sealed record PnLLineDto(
    TransactionCategory Category,
    decimal TotalAmount);
