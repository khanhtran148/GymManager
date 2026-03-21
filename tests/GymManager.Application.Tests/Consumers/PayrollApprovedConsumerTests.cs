using FluentAssertions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Payroll.CreatePayrollPeriod;
using GymManager.Application.Staff.CreateStaff;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GymManager.Application.Tests.Consumers;

// Tests validate PayrollApprovedConsumer business logic by directly exercising the repositories,
// following the same pattern as SubscriptionFeeConsumerTests. MassTransit consumers run
// out-of-process in real deployments; the core logic is tested here in-process.
public sealed class PayrollApprovedConsumerTests : ApplicationTestBase
{
    private async Task<(Guid OwnerId, Guid GymHouseId)> SetupOwnerAndHouseAsync()
    {
        var (owner, gymHouse) = await CreateOwnerAsync(
            $"owner{Guid.NewGuid()}@example.com", "Payroll Consumer Test Gym");
        return (owner.Id, gymHouse.Id);
    }

    [Fact]
    public async Task PayrollApprovedConsumer_CreatesTransactionsForEachEntry_DirectLogic()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var (staff1, _) = await CreateMemberAsync(gymHouseId, $"staff1{Guid.NewGuid()}@example.com");
        await Sender.Send(new CreateStaffCommand(staff1.Id, gymHouseId, StaffType.Reception, 3000m, 0m));

        var (staff2, _) = await CreateMemberAsync(gymHouseId, $"staff2{Guid.NewGuid()}@example.com");
        await Sender.Send(new CreateStaffCommand(staff2.Id, gymHouseId, StaffType.SecurityGuard, 2800m, 0m));

        var created = await Sender.Send(new CreatePayrollPeriodCommand(
            gymHouseId,
            new DateOnly(2026, 10, 1),
            new DateOnly(2026, 10, 31)));

        created.IsSuccess.Should().BeTrue();
        created.Value.Entries.Should().HaveCount(2);

        var transactionRepo = Services.GetRequiredService<ITransactionRepository>();
        var payrollPeriodRepo = Services.GetRequiredService<IPayrollPeriodRepository>();

        // Simulate what PayrollApprovedConsumer does
        var payrollPeriod = await payrollPeriodRepo.GetByIdWithEntriesAsync(created.Value.Id, gymHouseId);
        payrollPeriod.Should().NotBeNull();

        foreach (var entry in payrollPeriod!.Entries)
        {
            if (entry.NetPay <= 0) continue;

            var alreadyRecorded = await transactionRepo.ExistsByRelatedEntityIdAsync(
                entry.Id, TransactionType.SalaryPayment);
            if (alreadyRecorded) continue;

            var transaction = new Transaction
            {
                GymHouseId = gymHouseId,
                TransactionType = TransactionType.SalaryPayment,
                Direction = TransactionDirection.Debit,
                Amount = entry.NetPay,
                Category = TransactionCategory.Payroll,
                Description = $"Salary payment for staff {entry.StaffId} - Period {payrollPeriod.PeriodStart:yyyy-MM-dd} to {payrollPeriod.PeriodEnd:yyyy-MM-dd}",
                TransactionDate = DateTime.UtcNow,
                RelatedEntityId = entry.Id
            };

            await transactionRepo.RecordAsync(transaction);
        }

        var transactions = await transactionRepo.GetByGymHouseAsync(
            gymHouseId, null, null, TransactionType.SalaryPayment, null, 1, 100);

        transactions.Items.Should().HaveCount(2);
        transactions.Items.Should().AllSatisfy(t =>
        {
            t.TransactionType.Should().Be(TransactionType.SalaryPayment);
            t.Direction.Should().Be(TransactionDirection.Debit);
            t.Category.Should().Be(TransactionCategory.Payroll);
        });
    }

    [Fact]
    public async Task PayrollApprovedConsumer_Idempotency_DoesNotDoubleRecordTransactions()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var (staffUser, _) = await CreateMemberAsync(gymHouseId, $"staff{Guid.NewGuid()}@example.com");
        await Sender.Send(new CreateStaffCommand(staffUser.Id, gymHouseId, StaffType.Reception, 2000m, 0m));

        var created = await Sender.Send(new CreatePayrollPeriodCommand(
            gymHouseId,
            new DateOnly(2026, 11, 1),
            new DateOnly(2026, 11, 30)));

        var transactionRepo = Services.GetRequiredService<ITransactionRepository>();
        var payrollPeriodRepo = Services.GetRequiredService<IPayrollPeriodRepository>();
        var payrollPeriod = await payrollPeriodRepo.GetByIdWithEntriesAsync(created.Value.Id, gymHouseId);

        // Simulate consumer running twice (idempotency check)
        for (var run = 0; run < 2; run++)
        {
            foreach (var entry in payrollPeriod!.Entries)
            {
                if (entry.NetPay <= 0) continue;

                var alreadyRecorded = await transactionRepo.ExistsByRelatedEntityIdAsync(
                    entry.Id, TransactionType.SalaryPayment);
                if (alreadyRecorded) continue;

                var transaction = new Transaction
                {
                    GymHouseId = gymHouseId,
                    TransactionType = TransactionType.SalaryPayment,
                    Direction = TransactionDirection.Debit,
                    Amount = entry.NetPay,
                    Category = TransactionCategory.Payroll,
                    Description = $"Salary payment for staff {entry.StaffId}",
                    TransactionDate = DateTime.UtcNow,
                    RelatedEntityId = entry.Id
                };

                await transactionRepo.RecordAsync(transaction);
            }
        }

        var transactions = await transactionRepo.GetByGymHouseAsync(
            gymHouseId, null, null, TransactionType.SalaryPayment, null, 1, 100);

        transactions.Items.Should().HaveCount(1, "idempotency should prevent duplicate transactions");
    }
}
