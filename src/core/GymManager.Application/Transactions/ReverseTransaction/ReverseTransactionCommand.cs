using CSharpFunctionalExtensions;
using GymManager.Application.Transactions.Shared;
using MediatR;

namespace GymManager.Application.Transactions.ReverseTransaction;

public sealed record ReverseTransactionCommand(
    Guid GymHouseId,
    Guid TransactionId,
    string Reason) : IRequest<Result<TransactionDto>>;
