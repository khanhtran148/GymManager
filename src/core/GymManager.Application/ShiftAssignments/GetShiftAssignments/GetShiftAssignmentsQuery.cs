using CSharpFunctionalExtensions;
using GymManager.Application.ShiftAssignments.Shared;
using MediatR;

namespace GymManager.Application.ShiftAssignments.GetShiftAssignments;

public sealed record GetShiftAssignmentsQuery(
    Guid GymHouseId,
    DateOnly? From = null,
    DateOnly? To = null,
    Guid? StaffId = null) : IRequest<Result<List<ShiftAssignmentDto>>>;
