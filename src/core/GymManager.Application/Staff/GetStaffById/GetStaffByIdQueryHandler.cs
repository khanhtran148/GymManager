using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Staff.Shared;
using GymManager.Domain.Enums;
using Mapster;
using MediatR;

namespace GymManager.Application.Staff.GetStaffById;

public sealed class GetStaffByIdQueryHandler(
    IStaffRepository staffRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetStaffByIdQuery, Result<StaffDto>>
{
    public async Task<Result<StaffDto>> Handle(GetStaffByIdQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewStaff, ct);
        if (!canView)
            return Result.Failure<StaffDto>(new ForbiddenError().ToString());

        var staff = await staffRepository.GetByIdAsync(request.Id, request.GymHouseId, ct);
        if (staff is null)
            return Result.Failure<StaffDto>(new NotFoundError("Staff", request.Id).ToString());

        return Result.Success(staff.Adapt<StaffDto>());
    }
}
