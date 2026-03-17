using GymManager.Domain.Enums;

namespace GymManager.Application.ShiftAssignments.Shared;

public sealed record ShiftAssignmentDto(
    Guid Id,
    Guid StaffId,
    Guid GymHouseId,
    string StaffName,
    DateOnly ShiftDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    ShiftType ShiftType,
    ShiftStatus Status,
    DateTime CreatedAt);
