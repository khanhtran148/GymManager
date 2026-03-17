using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.ShiftAssignments.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.ShiftAssignments.GetShiftAssignments;

public sealed class GetShiftAssignmentsQueryHandler(
    IShiftAssignmentRepository shiftRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetShiftAssignmentsQuery, Result<List<ShiftAssignmentDto>>>
{
    public async Task<Result<List<ShiftAssignmentDto>>> Handle(GetShiftAssignmentsQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewShifts, ct);
        if (!canView)
            return Result.Failure<List<ShiftAssignmentDto>>(new ForbiddenError().ToString());

        var shifts = await shiftRepository.GetByGymHouseAsync(
            request.GymHouseId, request.From, request.To, request.StaffId, ct);

        return Result.Success(shifts.Select(ShiftAssignmentDto.FromEntity).ToList());
    }
}
