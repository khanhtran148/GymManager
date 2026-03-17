using CSharpFunctionalExtensions;
using GymManager.Application.Transactions.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Payments.ProcessPayment;

public sealed record ProcessPaymentCommand(
    Guid GymHouseId,
    decimal Amount,
    string Currency,
    string Description,
    TransactionType TransactionType,
    TransactionDirection Direction,
    TransactionCategory Category,
    DateTime TransactionDate,
    Guid? RelatedEntityId,
    Guid? ApprovedById,
    PaymentMethod? PaymentMethod) : IRequest<Result<TransactionDto>>;
