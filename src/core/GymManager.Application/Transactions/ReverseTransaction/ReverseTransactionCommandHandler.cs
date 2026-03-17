using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Transactions.Shared;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using MediatR;

namespace GymManager.Application.Transactions.ReverseTransaction;

public sealed class ReverseTransactionCommandHandler(
    ITransactionRepository transactionRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser,
    IPublisher publisher)
    : IRequestHandler<ReverseTransactionCommand, Result<TransactionDto>>
{
    public async Task<Result<TransactionDto>> Handle(ReverseTransactionCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageFinance, ct);
        if (!canManage)
            return Result.Failure<TransactionDto>(new ForbiddenError().ToString());

        var original = await transactionRepository.GetByIdAsync(request.TransactionId, request.GymHouseId, ct);
        if (original is null)
            return Result.Failure<TransactionDto>(new NotFoundError("Transaction", request.TransactionId).ToString());

        if (original.ReversedByTransactionId.HasValue)
            return Result.Failure<TransactionDto>(new ConflictError("Transaction has already been reversed.").ToString());

        if (original.ReversesTransactionId.HasValue)
            return Result.Failure<TransactionDto>(new ConflictError("Cannot reverse a reversal transaction.").ToString());

        var reversal = Transaction.CreateReversal(original, request.Reason);

        await transactionRepository.RecordAsync(reversal, ct);

        original.ReversedByTransactionId = reversal.Id;
        await transactionRepository.UpdateAsync(original, ct);

        await publisher.Publish(
            new TransactionRecordedEvent(reversal.Id, reversal.GymHouseId, reversal.TransactionType, reversal.Amount),
            ct);

        return Result.Success(TransactionDto.FromEntity(reversal));
    }
}
