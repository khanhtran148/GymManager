using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.ShiftAssignments.Shared;
using GymManager.Domain.Enums;
using Mapster;
using MediatR;

namespace GymManager.Application.ShiftAssignments.UpdateShiftAssignment;

public sealed class UpdateShiftAssignmentCommandHandler(
    IShiftAssignmentRepository shiftRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateShiftAssignmentCommand, Result<ShiftAssignmentDto>>
{
    public async Task<Result<ShiftAssignmentDto>> Handle(UpdateShiftAssignmentCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageShifts, ct);
        if (!canManage)
            return Result.Failure<ShiftAssignmentDto>(new ForbiddenError().ToString());

        var shift = await shiftRepository.GetByIdAsync(request.Id, request.GymHouseId, ct);
        if (shift is null)
            return Result.Failure<ShiftAssignmentDto>(new NotFoundError("ShiftAssignment", request.Id).ToString());

        shift.ShiftDate = request.ShiftDate;
        shift.StartTime = request.StartTime;
        shift.EndTime = request.EndTime;
        shift.ShiftType = request.ShiftType;
        shift.Status = request.Status;

        await shiftRepository.UpdateAsync(shift, ct);

        var updated = await shiftRepository.GetByIdAsync(shift.Id, request.GymHouseId, ct);
        return Result.Success(updated!.Adapt<ShiftAssignmentDto>());
    }
}
