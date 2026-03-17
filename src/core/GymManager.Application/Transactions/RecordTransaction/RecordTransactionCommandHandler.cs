using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Transactions.Shared;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using MediatR;

namespace GymManager.Application.Transactions.RecordTransaction;

public sealed class RecordTransactionCommandHandler(
    ITransactionRepository transactionRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser,
    IPublisher publisher)
    : IRequestHandler<RecordTransactionCommand, Result<TransactionDto>>
{
    public async Task<Result<TransactionDto>> Handle(RecordTransactionCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageFinance, ct);
        if (!canManage)
            return Result.Failure<TransactionDto>(new ForbiddenError().ToString());

        var transaction = new Transaction
        {
            GymHouseId = request.GymHouseId,
            TransactionType = request.TransactionType,
            Direction = request.Direction,
            Amount = request.Amount,
            Category = request.Category,
            Description = request.Description,
            TransactionDate = request.TransactionDate,
            RelatedEntityId = request.RelatedEntityId,
            ApprovedById = request.ApprovedById,
            PaymentMethod = request.PaymentMethod,
            ExternalReference = request.ExternalReference
        };

        await transactionRepository.RecordAsync(transaction, ct);

        await publisher.Publish(
            new TransactionRecordedEvent(transaction.Id, transaction.GymHouseId, transaction.TransactionType, transaction.Amount),
            ct);

        return Result.Success(TransactionDto.FromEntity(transaction));
    }
}
