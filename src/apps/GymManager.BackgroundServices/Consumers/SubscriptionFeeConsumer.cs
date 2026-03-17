using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using MassTransit;
using MediatR;

namespace GymManager.BackgroundServices.Consumers;

public sealed class SubscriptionFeeConsumer(
    ITransactionRepository transactionRepository,
    IPublisher publisher) : IConsumer<SubscriptionCreatedEvent>
{
    public async Task Consume(ConsumeContext<SubscriptionCreatedEvent> context)
    {
        var evt = context.Message;
        var ct = context.CancellationToken;

        if (evt.Price <= 0)
            return;

        var alreadyRecorded = await transactionRepository.ExistsByRelatedEntityIdAsync(
            evt.SubscriptionId, TransactionType.MembershipFee, ct);
        if (alreadyRecorded)
            return;

        var transaction = new Transaction
        {
            GymHouseId = evt.GymHouseId,
            TransactionType = TransactionType.MembershipFee,
            Direction = TransactionDirection.Credit,
            Amount = evt.Price,
            Category = TransactionCategory.Revenue,
            Description = $"Membership fee for subscription {evt.SubscriptionId}",
            TransactionDate = DateTime.UtcNow,
            RelatedEntityId = evt.SubscriptionId
        };

        await transactionRepository.RecordAsync(transaction, ct);

        await publisher.Publish(
            new TransactionRecordedEvent(transaction.Id, transaction.GymHouseId, transaction.TransactionType, transaction.Amount),
            ct);
    }
}
