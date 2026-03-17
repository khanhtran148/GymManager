using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Payroll.Shared;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Payroll.CreatePayrollPeriod;

public sealed class CreatePayrollPeriodCommandHandler(
    IPayrollPeriodRepository payrollPeriodRepository,
    IStaffRepository staffRepository,
    IBookingRepository bookingRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<CreatePayrollPeriodCommand, Result<PayrollPeriodDetailDto>>
{
    public async Task<Result<PayrollPeriodDetailDto>> Handle(CreatePayrollPeriodCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ApprovePayroll, ct);
        if (!canManage)
            return Result.Failure<PayrollPeriodDetailDto>(new ForbiddenError().ToString());

        var hasOverlap = await payrollPeriodRepository.HasOverlapAsync(
            request.GymHouseId, request.PeriodStart, request.PeriodEnd, ct);
        if (hasOverlap)
            return Result.Failure<PayrollPeriodDetailDto>(
                new ConflictError("Overlapping payroll period already exists for this gym house.").ToString());

        var allStaff = await staffRepository.GetAllByGymHouseAsync(request.GymHouseId, ct);

        var periodStartDateTime = request.PeriodStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var periodEndDateTime = request.PeriodEnd.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var entries = new List<PayrollEntry>();
        foreach (var staff in allStaff)
        {
            var classesTaught = 0;
            if (staff.StaffType == StaffType.Trainer)
            {
                classesTaught = await bookingRepository.CountCompletedByTrainerAsync(
                    staff.UserId, request.GymHouseId, periodStartDateTime, periodEndDateTime, ct);
            }

            var basePay = staff.BaseSalary;
            var classBonus = classesTaught * staff.PerClassBonus;
            var deductions = 0m;
            var netPay = basePay + classBonus - deductions;

            entries.Add(new PayrollEntry
            {
                StaffId = staff.Id,
                BasePay = basePay,
                ClassBonus = classBonus,
                Deductions = deductions,
                NetPay = netPay,
                ClassesTaught = classesTaught
            });
        }

        var payrollPeriod = new PayrollPeriod
        {
            GymHouseId = request.GymHouseId,
            PeriodStart = request.PeriodStart,
            PeriodEnd = request.PeriodEnd,
            Status = PayrollStatus.Draft,
            Entries = entries
        };

        await payrollPeriodRepository.CreateAsync(payrollPeriod, ct);

        var created = await payrollPeriodRepository.GetByIdWithEntriesAsync(
            payrollPeriod.Id, request.GymHouseId, ct);

        return Result.Success(PayrollPeriodDetailDto.FromEntity(created!));
    }
}
