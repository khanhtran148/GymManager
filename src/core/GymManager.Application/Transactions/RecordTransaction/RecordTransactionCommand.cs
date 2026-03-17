using CSharpFunctionalExtensions;
using GymManager.Application.Transactions.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Transactions.RecordTransaction;

public sealed record RecordTransactionCommand(
    Guid GymHouseId,
    TransactionType TransactionType,
    TransactionDirection Direction,
    decimal Amount,
    TransactionCategory Category,
    string Description,
    DateTime TransactionDate,
    Guid? RelatedEntityId,
    Guid? ApprovedById,
    PaymentMethod? PaymentMethod,
    string? ExternalReference) : IRequest<Result<TransactionDto>>;
