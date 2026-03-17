using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Application.Transactions.Shared;

public sealed record TransactionDto(
    Guid Id,
    Guid GymHouseId,
    TransactionType TransactionType,
    TransactionDirection Direction,
    decimal Amount,
    TransactionCategory Category,
    string Description,
    DateTime TransactionDate,
    Guid? RelatedEntityId,
    Guid? ReversesTransactionId,
    Guid? ReversedByTransactionId,
    Guid? ApprovedById,
    PaymentMethod? PaymentMethod,
    string? ExternalReference,
    DateTime CreatedAt)
{
    internal static TransactionDto FromEntity(Transaction t) => new(
        t.Id,
        t.GymHouseId,
        t.TransactionType,
        t.Direction,
        t.Amount,
        t.Category,
        t.Description,
        t.TransactionDate,
        t.RelatedEntityId,
        t.ReversesTransactionId,
        t.ReversedByTransactionId,
        t.ApprovedById,
        t.PaymentMethod,
        t.ExternalReference,
        t.CreatedAt);
}
