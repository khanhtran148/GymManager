using FluentAssertions;
using GymManager.Application.Transactions.GetTransactions;
using GymManager.Application.Transactions.RecordTransaction;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Transactions;

public sealed class GetTransactionsQueryHandlerTests : ApplicationTestBase
{
    private async Task<(Guid OwnerId, Guid GymHouseId)> SetupOwnerAndHouseAsync()
    {
        var (owner, gymHouse) = await CreateOwnerAsync(
            $"owner{Guid.NewGuid()}@example.com", "Get Transactions Gym");
        return (owner.Id, gymHouse.Id);
    }

    private async Task RecordTransactionAsync(Guid gymHouseId, TransactionType type, TransactionDirection direction, decimal amount)
    {
        await Sender.Send(new RecordTransactionCommand(
            gymHouseId, type, direction, amount, TransactionCategory.Revenue,
            "Test transaction", DateTime.UtcNow, null, null, null, null));
    }

    [Fact]
    public async Task GetTransactions_WithViewFinancePermission_ReturnsPaged()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        await RecordTransactionAsync(gymHouseId, TransactionType.MembershipFee, TransactionDirection.Credit, 100m);
        await RecordTransactionAsync(gymHouseId, TransactionType.Rent, TransactionDirection.Debit, 500m);

        var query = new GetTransactionsQuery(gymHouseId, 1, 20, null, null, null, null);
        var result = await Sender.Send(query);

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(2);
        result.Value.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetTransactions_FilterByType_ReturnsFiltered()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        await RecordTransactionAsync(gymHouseId, TransactionType.MembershipFee, TransactionDirection.Credit, 100m);
        await RecordTransactionAsync(gymHouseId, TransactionType.Rent, TransactionDirection.Debit, 500m);

        var query = new GetTransactionsQuery(gymHouseId, 1, 20, TransactionType.MembershipFee, null, null, null);
        var result = await Sender.Send(query);

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(1);
        result.Value.Items[0].TransactionType.Should().Be(TransactionType.MembershipFee);
    }

    [Fact]
    public async Task GetTransactions_FilterByDirection_ReturnsFiltered()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        await RecordTransactionAsync(gymHouseId, TransactionType.MembershipFee, TransactionDirection.Credit, 100m);
        await RecordTransactionAsync(gymHouseId, TransactionType.Rent, TransactionDirection.Debit, 500m);

        var query = new GetTransactionsQuery(gymHouseId, 1, 20, null, TransactionDirection.Debit, null, null);
        var result = await Sender.Send(query);

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(1);
        result.Value.Items[0].Direction.Should().Be(TransactionDirection.Debit);
    }

    [Fact]
    public async Task GetTransactions_WithoutViewFinancePermission_ReturnsForbidden()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        CurrentUser.Permissions = Permission.ManageMembers;

        var query = new GetTransactionsQuery(gymHouseId, 1, 20, null, null, null, null);
        var result = await Sender.Send(query);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }

    [Fact]
    public async Task GetTransactions_Pagination_RespectsPageSize()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        for (var i = 0; i < 5; i++)
            await RecordTransactionAsync(gymHouseId, TransactionType.MembershipFee, TransactionDirection.Credit, 100m + i);

        var query = new GetTransactionsQuery(gymHouseId, 1, 2, null, null, null, null);
        var result = await Sender.Send(query);

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().HaveCount(2);
        result.Value.TotalCount.Should().Be(5);
        result.Value.Page.Should().Be(1);
        result.Value.PageSize.Should().Be(2);
    }
}
