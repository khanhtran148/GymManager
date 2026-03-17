using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.ShiftAssignments.Shared;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.ShiftAssignments.CreateShiftAssignment;

public sealed class CreateShiftAssignmentCommandHandler(
    IShiftAssignmentRepository shiftRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<CreateShiftAssignmentCommand, Result<ShiftAssignmentDto>>
{
    public async Task<Result<ShiftAssignmentDto>> Handle(CreateShiftAssignmentCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageShifts, ct);
        if (!canManage)
            return Result.Failure<ShiftAssignmentDto>(new ForbiddenError().ToString());

        var shift = new ShiftAssignment
        {
            StaffId = request.StaffId,
            GymHouseId = request.GymHouseId,
            ShiftDate = request.ShiftDate,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            ShiftType = request.ShiftType,
            Status = ShiftStatus.Scheduled
        };

        await shiftRepository.CreateAsync(shift, ct);

        var created = await shiftRepository.GetByIdAsync(shift.Id, request.GymHouseId, ct);
        return Result.Success(ShiftAssignmentDto.FromEntity(created!));
    }
}
