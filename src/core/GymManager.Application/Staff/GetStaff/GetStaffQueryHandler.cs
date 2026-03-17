using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Staff.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Staff.GetStaff;

public sealed class GetStaffQueryHandler(
    IStaffRepository staffRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetStaffQuery, Result<PagedList<StaffDto>>>
{
    public async Task<Result<PagedList<StaffDto>>> Handle(GetStaffQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewStaff, ct);
        if (!canView)
            return Result.Failure<PagedList<StaffDto>>(new ForbiddenError().ToString());

        var paged = await staffRepository.GetByGymHouseAsync(
            request.GymHouseId, request.StaffType, request.Page, request.PageSize, ct);

        var dtos = new PagedList<StaffDto>(
            paged.Items.Select(StaffDto.FromEntity).ToList(),
            paged.TotalCount,
            paged.Page,
            paged.PageSize);

        return Result.Success(dtos);
    }
}
