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
    int ClassesTaught);

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
    DateTime CreatedAt);

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
    DateTime CreatedAt);
