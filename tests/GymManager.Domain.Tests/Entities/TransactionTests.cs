using FluentAssertions;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Domain.Tests.Entities;

public sealed class TransactionTests
{
    [Fact]
    public void Transaction_DefaultProperties_AreSet()
    {
        var transaction = new Transaction
        {
            GymHouseId = Guid.NewGuid(),
            TransactionType = TransactionType.MembershipFee,
            Direction = TransactionDirection.Credit,
            Amount = 100m,
            Category = TransactionCategory.Revenue,
            Description = "Test",
            TransactionDate = DateTime.UtcNow
        };

        transaction.Id.Should().NotBeEmpty();
        transaction.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        transaction.DeletedAt.Should().BeNull();
    }

    [Fact]
    public void CreateReversal_CreditTransaction_ProducesDebitReversal()
    {
        var original = new Transaction
        {
            GymHouseId = Guid.NewGuid(),
            TransactionType = TransactionType.MembershipFee,
            Direction = TransactionDirection.Credit,
            Amount = 200m,
            Category = TransactionCategory.Revenue,
            Description = "Original transaction",
            TransactionDate = DateTime.UtcNow
        };

        var reversal = Transaction.CreateReversal(original, "Wrong amount");

        reversal.Direction.Should().Be(TransactionDirection.Debit);
        reversal.Amount.Should().Be(original.Amount);
        reversal.GymHouseId.Should().Be(original.GymHouseId);
        reversal.TransactionType.Should().Be(original.TransactionType);
        reversal.Category.Should().Be(original.Category);
        reversal.ReversesTransactionId.Should().Be(original.Id);
        reversal.Description.Should().Contain("Reversal");
        reversal.Description.Should().Contain("Wrong amount");
    }

    [Fact]
    public void CreateReversal_DebitTransaction_ProducesCreditReversal()
    {
        var original = new Transaction
        {
            GymHouseId = Guid.NewGuid(),
            TransactionType = TransactionType.Expense,
            Direction = TransactionDirection.Debit,
            Amount = 500m,
            Category = TransactionCategory.OperatingExpense,
            Description = "Rent payment",
            TransactionDate = DateTime.UtcNow
        };

        var reversal = Transaction.CreateReversal(original, "Duplicate entry");

        reversal.Direction.Should().Be(TransactionDirection.Credit);
        reversal.Amount.Should().Be(original.Amount);
        reversal.ReversesTransactionId.Should().Be(original.Id);
    }

    [Fact]
    public void CreateReversal_PreservesGymHouseId()
    {
        var gymHouseId = Guid.NewGuid();
        var original = new Transaction
        {
            GymHouseId = gymHouseId,
            TransactionType = TransactionType.Other,
            Direction = TransactionDirection.Credit,
            Amount = 50m,
            Category = TransactionCategory.Revenue,
            Description = "Test",
            TransactionDate = DateTime.UtcNow
        };

        var reversal = Transaction.CreateReversal(original, "Error");

        reversal.GymHouseId.Should().Be(gymHouseId);
    }

    [Fact]
    public void Transaction_HasNullDeletedAt_ByDefault()
    {
        var transaction = new Transaction
        {
            GymHouseId = Guid.NewGuid(),
            TransactionType = TransactionType.MembershipFee,
            Direction = TransactionDirection.Credit,
            Amount = 100m,
            Category = TransactionCategory.Revenue,
            Description = "Test",
            TransactionDate = DateTime.UtcNow
        };

        transaction.DeletedAt.Should().BeNull();
        transaction.IsDeleted.Should().BeFalse();
    }
}
