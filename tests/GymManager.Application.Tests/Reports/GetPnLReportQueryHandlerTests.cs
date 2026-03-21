using FluentAssertions;
using GymManager.Application.Reports.GetPnLReport;
using GymManager.Application.Transactions.RecordTransaction;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Reports;

public sealed class GetPnLReportQueryHandlerTests : ApplicationTestBase
{
    private async Task<(Guid OwnerId, Guid GymHouseId)> SetupOwnerAndHouseAsync()
    {
        var (owner, gymHouse) = await CreateOwnerAsync(
            $"owner{Guid.NewGuid()}@example.com", "PnL Report Test Gym");
        return (owner.Id, gymHouse.Id);
    }

    [Fact]
    public async Task GetPnLReport_WithTransactions_ReturnsCorrectGroupings()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var from = DateTime.UtcNow.AddDays(-30);
        var to = DateTime.UtcNow.AddDays(1);

        await Sender.Send(new RecordTransactionCommand(
            gymHouseId, TransactionType.MembershipFee, TransactionDirection.Credit,
            300m, TransactionCategory.Revenue, "Membership fee 1", DateTime.UtcNow,
            null, null, null, null));

        await Sender.Send(new RecordTransactionCommand(
            gymHouseId, TransactionType.MembershipFee, TransactionDirection.Credit,
            200m, TransactionCategory.Revenue, "Membership fee 2", DateTime.UtcNow,
            null, null, null, null));

        await Sender.Send(new RecordTransactionCommand(
            gymHouseId, TransactionType.Rent, TransactionDirection.Debit,
            1000m, TransactionCategory.OperatingExpense, "Rent", DateTime.UtcNow,
            null, null, null, null));

        var result = await Sender.Send(new GetPnLReportQuery(gymHouseId, from, to));

        result.IsSuccess.Should().BeTrue();
        result.Value.TotalIncome.Should().Be(500m);
        result.Value.TotalExpense.Should().Be(1000m);
        result.Value.NetProfit.Should().Be(-500m);
        result.Value.IncomeLines.Should().HaveCount(1);
        result.Value.IncomeLines[0].Category.Should().Be(TransactionCategory.Revenue);
        result.Value.IncomeLines[0].TotalAmount.Should().Be(500m);
        result.Value.ExpenseLines.Should().HaveCount(1);
        result.Value.ExpenseLines[0].Category.Should().Be(TransactionCategory.OperatingExpense);
        result.Value.ExpenseLines[0].TotalAmount.Should().Be(1000m);
    }

    [Fact]
    public async Task GetPnLReport_FiltersByDateRange()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var oldDate = DateTime.UtcNow.AddDays(-60);

        await Sender.Send(new RecordTransactionCommand(
            gymHouseId, TransactionType.MembershipFee, TransactionDirection.Credit,
            100m, TransactionCategory.Revenue, "Old fee", oldDate,
            null, null, null, null));

        await Sender.Send(new RecordTransactionCommand(
            gymHouseId, TransactionType.MembershipFee, TransactionDirection.Credit,
            200m, TransactionCategory.Revenue, "Recent fee", DateTime.UtcNow,
            null, null, null, null));

        var from = DateTime.UtcNow.AddDays(-10);
        var to = DateTime.UtcNow.AddDays(1);

        var result = await Sender.Send(new GetPnLReportQuery(gymHouseId, from, to));

        result.IsSuccess.Should().BeTrue();
        result.Value.TotalIncome.Should().Be(200m);
    }

    [Fact]
    public async Task GetPnLReport_WithoutViewReportsPermission_ReturnsForbidden()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        CurrentUser.Permissions = Permission.ViewFinance;

        var result = await Sender.Send(new GetPnLReportQuery(gymHouseId, DateTime.UtcNow.AddDays(-30), DateTime.UtcNow));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }

    [Fact]
    public async Task GetPnLReport_NoTransactions_ReturnsZeros()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var from = DateTime.UtcNow.AddDays(-30);
        var to = DateTime.UtcNow.AddDays(1);

        var result = await Sender.Send(new GetPnLReportQuery(gymHouseId, from, to));

        result.IsSuccess.Should().BeTrue();
        result.Value.TotalIncome.Should().Be(0m);
        result.Value.TotalExpense.Should().Be(0m);
        result.Value.NetProfit.Should().Be(0m);
        result.Value.IncomeLines.Should().BeEmpty();
        result.Value.ExpenseLines.Should().BeEmpty();
    }

    [Fact]
    public async Task GetPnLReport_MultipleExpenseCategories_GroupsCorrectly()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var from = DateTime.UtcNow.AddDays(-30);
        var to = DateTime.UtcNow.AddDays(1);

        await Sender.Send(new RecordTransactionCommand(
            gymHouseId, TransactionType.Rent, TransactionDirection.Debit,
            1000m, TransactionCategory.OperatingExpense, "Rent", DateTime.UtcNow,
            null, null, null, null));

        await Sender.Send(new RecordTransactionCommand(
            gymHouseId, TransactionType.SalaryPayment, TransactionDirection.Debit,
            2000m, TransactionCategory.Payroll, "Trainer salary", DateTime.UtcNow,
            null, null, null, null));

        var result = await Sender.Send(new GetPnLReportQuery(gymHouseId, from, to));

        result.IsSuccess.Should().BeTrue();
        result.Value.ExpenseLines.Should().HaveCount(2);
        result.Value.TotalExpense.Should().Be(3000m);
    }
}
