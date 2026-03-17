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

        foreach (var entry in payrollPeriod.Entries)
        {
            if (entry.NetPay <= 0)
                continue;

            var alreadyRecorded = await transactionRepository.ExistsByRelatedEntityIdAsync(
                entry.Id, TransactionType.SalaryPayment, ct);
            if (alreadyRecorded)
                continue;

            var transaction = new Transaction
            {
                GymHouseId = evt.GymHouseId,
                TransactionType = TransactionType.SalaryPayment,
                Direction = TransactionDirection.Debit,
                Amount = entry.NetPay,
                Category = TransactionCategory.Payroll,
                Description = $"Salary payment for staff {entry.StaffId} - Period {payrollPeriod.PeriodStart:yyyy-MM-dd} to {payrollPeriod.PeriodEnd:yyyy-MM-dd}",
                TransactionDate = DateTime.UtcNow,
                RelatedEntityId = entry.Id
            };

            await transactionRepository.RecordAsync(transaction, ct);

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
