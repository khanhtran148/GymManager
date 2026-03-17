using CSharpFunctionalExtensions;
using GymManager.Application.ShiftAssignments.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.ShiftAssignments.UpdateShiftAssignment;

public sealed record UpdateShiftAssignmentCommand(
    Guid Id,
    Guid GymHouseId,
    DateOnly ShiftDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    ShiftType ShiftType,
    ShiftStatus Status) : IRequest<Result<ShiftAssignmentDto>>;
