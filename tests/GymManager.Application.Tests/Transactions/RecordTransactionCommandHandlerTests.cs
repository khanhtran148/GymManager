using FluentAssertions;
using FluentValidation;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Transactions.RecordTransaction;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Transactions;

public sealed class RecordTransactionCommandHandlerTests : ApplicationTestBase
{
    private async Task<(Guid OwnerId, Guid GymHouseId)> SetupOwnerAndHouseAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var house = await Sender.Send(new CreateGymHouseCommand("Finance Gym", "123 Test St", null, null, 50));
        return (reg.Value.UserId, house.Value.Id);
    }

    [Fact]
    public async Task RecordTransaction_WithManageFinancePermission_Succeeds()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var command = new RecordTransactionCommand(
            gymHouseId,
            TransactionType.MembershipFee,
            TransactionDirection.Credit,
            150m,
            TransactionCategory.Revenue,
            "Monthly membership fee",
            DateTime.UtcNow,
            null,
            null,
            PaymentMethod.Card,
            null);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.GymHouseId.Should().Be(gymHouseId);
        result.Value.Amount.Should().Be(150m);
        result.Value.Direction.Should().Be(TransactionDirection.Credit);
        result.Value.TransactionType.Should().Be(TransactionType.MembershipFee);
        result.Value.Id.Should().NotBeEmpty();
    }

    [Fact]
    public async Task RecordTransaction_WithoutManageFinancePermission_ReturnsForbidden()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        CurrentUser.Permissions = Permission.ViewFinance;

        var command = new RecordTransactionCommand(
            gymHouseId,
            TransactionType.Expense,
            TransactionDirection.Debit,
            200m,
            TransactionCategory.OperatingExpense,
            "Rent",
            DateTime.UtcNow,
            null,
            null,
            null,
            null);

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100.50)]
    public async Task RecordTransaction_WithInvalidAmount_ThrowsValidationException(decimal invalidAmount)
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var command = new RecordTransactionCommand(
            gymHouseId,
            TransactionType.MembershipFee,
            TransactionDirection.Credit,
            invalidAmount,
            TransactionCategory.Revenue,
            "Test",
            DateTime.UtcNow,
            null,
            null,
            null,
            null);

        await Assert.ThrowsAsync<ValidationException>(() => Sender.Send(command));
    }

    [Fact]
    public async Task RecordTransaction_WithEmptyDescription_ThrowsValidationException()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var command = new RecordTransactionCommand(
            gymHouseId,
            TransactionType.MembershipFee,
            TransactionDirection.Credit,
            100m,
            TransactionCategory.Revenue,
            "",
            DateTime.UtcNow,
            null,
            null,
            null,
            null);

        await Assert.ThrowsAsync<ValidationException>(() => Sender.Send(command));
    }

    [Fact]
    public async Task RecordTransaction_DebitTransaction_Succeeds()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var command = new RecordTransactionCommand(
            gymHouseId,
            TransactionType.Rent,
            TransactionDirection.Debit,
            2000m,
            TransactionCategory.OperatingExpense,
            "Monthly rent",
            DateTime.UtcNow,
            null,
            null,
            PaymentMethod.BankTransfer,
            "REF-12345");

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Direction.Should().Be(TransactionDirection.Debit);
        result.Value.PaymentMethod.Should().Be(PaymentMethod.BankTransfer);
        result.Value.ExternalReference.Should().Be("REF-12345");
    }
}
