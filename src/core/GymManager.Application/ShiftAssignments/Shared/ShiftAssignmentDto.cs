using GymManager.Domain.Entities;
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
    DateTime CreatedAt)
{
    internal static ShiftAssignmentDto FromEntity(ShiftAssignment s) => new(
        s.Id,
        s.StaffId,
        s.GymHouseId,
        s.Staff?.User?.FullName ?? string.Empty,
        s.ShiftDate,
        s.StartTime,
        s.EndTime,
        s.ShiftType,
        s.Status,
        s.CreatedAt);
}
