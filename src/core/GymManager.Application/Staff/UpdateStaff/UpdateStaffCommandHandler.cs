using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Staff.Shared;
using GymManager.Domain.Enums;
using Mapster;
using MediatR;

namespace GymManager.Application.Staff.UpdateStaff;

public sealed class UpdateStaffCommandHandler(
    IStaffRepository staffRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateStaffCommand, Result<StaffDto>>
{
    public async Task<Result<StaffDto>> Handle(UpdateStaffCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageStaff, ct);
        if (!canManage)
            return Result.Failure<StaffDto>(new ForbiddenError().ToString());

        var staff = await staffRepository.GetByIdAsync(request.Id, request.GymHouseId, ct);
        if (staff is null)
            return Result.Failure<StaffDto>(new NotFoundError("Staff", request.Id).ToString());

        staff.StaffType = request.StaffType;
        staff.BaseSalary = request.BaseSalary;
        staff.PerClassBonus = request.PerClassBonus;

        await staffRepository.UpdateAsync(staff, ct);

        var updated = await staffRepository.GetByIdAsync(staff.Id, request.GymHouseId, ct);
        return Result.Success(updated!.Adapt<StaffDto>());
    }
}
