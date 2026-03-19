using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using MassTransit;
using MediatR;

namespace GymManager.BackgroundServices.Consumers;

public sealed class PayrollApprovedConsumer(
    IPayrollPeriodRepository payrollPeriodRepository,
    ITransactionRepository transactionRepository,
    IPublisher publisher) : IConsumer<PayrollApprovedEvent>
{
    public async Task Consume(ConsumeContext<PayrollApprovedEvent> context)
    {
        var evt = context.Message;
        var ct = context.CancellationToken;

        var payrollPeriod = await payrollPeriodRepository.GetByIdWithEntriesAsync(
            evt.PayrollPeriodId, evt.GymHouseId, ct);

        if (payrollPeriod is null)
            return;

        var eligibleEntries = payrollPeriod.Entries
            .Where(e => e.NetPay > 0)
            .ToList();

        if (eligibleEntries.Count == 0)
            return;

        // Batch-check which entries already have a recorded transaction — one query instead of N.
        var entryIds = eligibleEntries.Select(e => e.Id).ToList();
        var alreadyRecordedIds = await transactionRepository.GetExistingRelatedEntityIdsAsync(
            entryIds, TransactionType.SalaryPayment, ct);

        var periodLabel = $"{payrollPeriod.PeriodStart:yyyy-MM-dd} to {payrollPeriod.PeriodEnd:yyyy-MM-dd}";
        var now = DateTime.UtcNow;

        var newTransactions = eligibleEntries
            .Where(e => !alreadyRecordedIds.Contains(e.Id))
            .Select(e => new Transaction
            {
                GymHouseId = evt.GymHouseId,
                TransactionType = TransactionType.SalaryPayment,
                Direction = TransactionDirection.Debit,
                Amount = e.NetPay,
                Category = TransactionCategory.Payroll,
                Description = $"Salary payment for staff {e.StaffId} - Period {periodLabel}",
                TransactionDate = now,
                RelatedEntityId = e.Id
            })
            .ToList();

        // Batch-insert all new transactions — one SaveChanges instead of N.
        await transactionRepository.RecordBatchAsync(newTransactions, ct);

        // Publish a domain event per transaction so downstream consumers remain unchanged.
        foreach (var transaction in newTransactions)
        {
            await publisher.Publish(
                new TransactionRecordedEvent(
                    transaction.Id,
                    transaction.GymHouseId,
                    transaction.TransactionType,
                    transaction.Amount),
                ct);
        }
    }
}
