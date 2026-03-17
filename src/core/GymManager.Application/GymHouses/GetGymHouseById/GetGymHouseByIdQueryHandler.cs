using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.GymHouses.Shared;
using GymManager.Domain.Enums;
using Mapster;
using MediatR;

namespace GymManager.Application.GymHouses.GetGymHouseById;

public sealed class GetGymHouseByIdQueryHandler(
    IGymHouseRepository gymHouseRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetGymHouseByIdQuery, Result<GymHouseDto>>
{
    public async Task<Result<GymHouseDto>> Handle(GetGymHouseByIdQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, currentUser.TenantId, Permission.ViewMembers, ct);
        if (!canView)
            return Result.Failure<GymHouseDto>(new ForbiddenError().ToString());

        var gymHouse = await gymHouseRepository.GetByIdAsync(request.Id, ct);
        if (gymHouse is null)
            return Result.Failure<GymHouseDto>(new NotFoundError("GymHouse", request.Id).ToString());

        return Result.Success(gymHouse.Adapt<GymHouseDto>());
    }
}
