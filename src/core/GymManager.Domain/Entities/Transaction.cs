using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Entities;

public sealed class Transaction : AuditableEntity
{
    public Guid GymHouseId { get; set; }
    public TransactionType TransactionType { get; set; }
    public TransactionDirection Direction { get; set; }
    public decimal Amount { get; set; }
    public TransactionCategory Category { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime TransactionDate { get; set; }
    public Guid? RelatedEntityId { get; set; }
    public Guid? ReversesTransactionId { get; set; }
    public Guid? ReversedByTransactionId { get; set; }
    public Guid? ApprovedById { get; set; }
    public PaymentMethod? PaymentMethod { get; set; }
    public string? ExternalReference { get; set; }

    public GymHouse GymHouse { get; set; } = null!;
    public Transaction? ReversesTransaction { get; set; }
    public Transaction? ReversedByTransaction { get; set; }

    public static Transaction CreateReversal(Transaction original, string reason) =>
        new()
        {
            GymHouseId = original.GymHouseId,
            TransactionType = original.TransactionType,
            Direction = original.Direction == TransactionDirection.Credit
                ? TransactionDirection.Debit
                : TransactionDirection.Credit,
            Amount = original.Amount,
            Category = original.Category,
            Description = $"Reversal of transaction {original.Id}: {reason}",
            TransactionDate = DateTime.UtcNow,
            ReversesTransactionId = original.Id,
            ApprovedById = original.ApprovedById,
            PaymentMethod = original.PaymentMethod
        };
}
