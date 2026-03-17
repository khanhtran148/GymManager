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

        var trainerUserIds = allStaff
            .Where(s => s.StaffType == StaffType.Trainer)
            .Select(s => s.UserId)
            .ToList();

        var trainerClassCounts = trainerUserIds.Count > 0
            ? await bookingRepository.CountCompletedByTrainersBatchAsync(
                trainerUserIds, request.GymHouseId, periodStartDateTime, periodEndDateTime, ct)
            : new Dictionary<Guid, int>();

        var entries = new List<PayrollEntry>();
        foreach (var staff in allStaff)
        {
            var classesTaught = staff.StaffType == StaffType.Trainer
                ? trainerClassCounts.GetValueOrDefault(staff.UserId, 0)
                : 0;

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

        return Result.Success(PayrollPeriodDetailDto.FromEntity(payrollPeriod));
    }
}
