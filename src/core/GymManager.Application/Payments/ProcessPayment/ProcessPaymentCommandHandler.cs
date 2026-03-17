using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Transactions.Shared;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using Mapster;
using MediatR;

namespace GymManager.Application.Payments.ProcessPayment;

public sealed class ProcessPaymentCommandHandler(
    ITransactionRepository transactionRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser,
    IPaymentGatewayService paymentGateway,
    IPublisher publisher)
    : IRequestHandler<ProcessPaymentCommand, Result<TransactionDto>>
{
    public async Task<Result<TransactionDto>> Handle(ProcessPaymentCommand request, CancellationToken ct)
    {
        // 1. Permission check — always first
        var canProcess = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ProcessPayments, ct);
        if (!canProcess)
            return Result.Failure<TransactionDto>(new ForbiddenError().ToString());

        // 2. Call payment gateway
        var chargeResult = await paymentGateway.CreateChargeAsync(
            request.Amount, request.Currency, request.Description, ct);
        if (chargeResult.IsFailure)
            return Result.Failure<TransactionDto>(chargeResult.Error);

        // 3. Record transaction with external reference
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
            ExternalReference = chargeResult.Value.ExternalReference
        };

        await transactionRepository.RecordAsync(transaction, ct);

        // 4. Publish domain event
        await publisher.Publish(
            new TransactionRecordedEvent(transaction.Id, transaction.GymHouseId, transaction.TransactionType, transaction.Amount),
            ct);

        return Result.Success(transaction.Adapt<TransactionDto>());
    }
}
