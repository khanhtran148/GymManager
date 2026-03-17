using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Application.Payroll.Shared;

public sealed record PayrollEntryDto(
    Guid Id,
    Guid PayrollPeriodId,
    Guid StaffId,
    string StaffName,
    StaffType StaffType,
    decimal BasePay,
    decimal ClassBonus,
    decimal Deductions,
    decimal NetPay,
    int ClassesTaught)
{
    internal static PayrollEntryDto FromEntity(PayrollEntry e) => new(
        e.Id,
        e.PayrollPeriodId,
        e.StaffId,
        e.Staff?.User?.FullName ?? string.Empty,
        e.Staff?.StaffType ?? default,
        e.BasePay,
        e.ClassBonus,
        e.Deductions,
        e.NetPay,
        e.ClassesTaught);
}

public sealed record PayrollPeriodDto(
    Guid Id,
    Guid GymHouseId,
    DateOnly PeriodStart,
    DateOnly PeriodEnd,
    PayrollStatus Status,
    Guid? ApprovedById,
    DateTime? ApprovedAt,
    decimal TotalNetPay,
    int EntryCount,
    DateTime CreatedAt)
{
    internal static PayrollPeriodDto FromEntity(PayrollPeriod p) => new(
        p.Id,
        p.GymHouseId,
        p.PeriodStart,
        p.PeriodEnd,
        p.Status,
        p.ApprovedById,
        p.ApprovedAt,
        p.Entries.Sum(e => e.NetPay),
        p.Entries.Count,
        p.CreatedAt);
}

public sealed record PayrollPeriodDetailDto(
    Guid Id,
    Guid GymHouseId,
    DateOnly PeriodStart,
    DateOnly PeriodEnd,
    PayrollStatus Status,
    Guid? ApprovedById,
    DateTime? ApprovedAt,
    List<PayrollEntryDto> Entries,
    decimal TotalNetPay,
    DateTime CreatedAt)
{
    internal static PayrollPeriodDetailDto FromEntity(PayrollPeriod p)
    {
        var entries = p.Entries.Select(PayrollEntryDto.FromEntity).ToList();
        return new(
            p.Id,
            p.GymHouseId,
            p.PeriodStart,
            p.PeriodEnd,
            p.Status,
            p.ApprovedById,
            p.ApprovedAt,
            entries,
            entries.Sum(e => e.NetPay),
            p.CreatedAt);
    }
}
