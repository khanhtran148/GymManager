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
    DateTime CreatedAt);
