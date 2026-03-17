using CSharpFunctionalExtensions;
using GymManager.Application.ShiftAssignments.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.ShiftAssignments.CreateShiftAssignment;

public sealed record CreateShiftAssignmentCommand(
    Guid StaffId,
    Guid GymHouseId,
    DateOnly ShiftDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    ShiftType ShiftType) : IRequest<Result<ShiftAssignmentDto>>;
