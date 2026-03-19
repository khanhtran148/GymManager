using FluentAssertions;
using FluentValidation;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Transactions.RecordTransaction;
using GymManager.Application.Transactions.ReverseTransaction;
using GymManager.Application.Transactions.Shared;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Transactions;

public sealed class ReverseTransactionCommandHandlerTests : ApplicationTestBase
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

    private async Task<TransactionDto> RecordCreditTransactionAsync(Guid gymHouseId)
    {
        var command = new RecordTransactionCommand(
            gymHouseId,
            TransactionType.MembershipFee,
            TransactionDirection.Credit,
            150m,
            TransactionCategory.Revenue,
            "Test transaction",
            DateTime.UtcNow,
            null,
            null,
            null,
            null);

        var result = await Sender.Send(command);
        return result.Value;
    }

    [Fact]
    public async Task ReverseTransaction_ValidTransaction_ProducesOppositeEntry()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var original = await RecordCreditTransactionAsync(gymHouseId);

        var reverseCommand = new ReverseTransactionCommand(gymHouseId, original.Id, "Entered by mistake");

        var result = await Sender.Send(reverseCommand);

        result.IsSuccess.Should().BeTrue();
        result.Value.Direction.Should().Be(TransactionDirection.Debit);
        result.Value.Amount.Should().Be(original.Amount);
        result.Value.ReversesTransactionId.Should().Be(original.Id);
        result.Value.GymHouseId.Should().Be(gymHouseId);
    }

    [Fact]
    public async Task ReverseTransaction_AlreadyReversed_ReturnsConflict()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var original = await RecordCreditTransactionAsync(gymHouseId);

        await Sender.Send(new ReverseTransactionCommand(gymHouseId, original.Id, "First reversal"));

        var result = await Sender.Send(new ReverseTransactionCommand(gymHouseId, original.Id, "Second reversal"));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("already been reversed");
    }

    [Fact]
    public async Task ReverseTransaction_ReversingAReversal_ReturnsConflict()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var original = await RecordCreditTransactionAsync(gymHouseId);

        var reversalResult = await Sender.Send(new ReverseTransactionCommand(gymHouseId, original.Id, "First reversal"));
        var reversalId = reversalResult.Value.Id;

        var result = await Sender.Send(new ReverseTransactionCommand(gymHouseId, reversalId, "Reversing a reversal"));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Cannot reverse a reversal");
    }

    [Fact]
    public async Task ReverseTransaction_TransactionNotFound_ReturnsNotFound()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var nonExistentId = Guid.NewGuid();

        var result = await Sender.Send(new ReverseTransactionCommand(gymHouseId, nonExistentId, "Reason"));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task ReverseTransaction_WithoutManageFinancePermission_ReturnsForbidden()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var original = await RecordCreditTransactionAsync(gymHouseId);

        CurrentUser.Permissions = Permission.ViewFinance;

        var result = await Sender.Send(new ReverseTransactionCommand(gymHouseId, original.Id, "Reason"));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }

    [Fact]
    public async Task ReverseTransaction_EmptyReason_ThrowsValidationException()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var original = await RecordCreditTransactionAsync(gymHouseId);

        await Assert.ThrowsAsync<ValidationException>(
            () => Sender.Send(new ReverseTransactionCommand(gymHouseId, original.Id, "")));
    }
}
