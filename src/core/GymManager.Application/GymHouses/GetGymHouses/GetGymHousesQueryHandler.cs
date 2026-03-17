using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.GymHouses.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.GymHouses.GetGymHouses;

public sealed class GetGymHousesQueryHandler(
    IGymHouseRepository gymHouseRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetGymHousesQuery, Result<List<GymHouseDto>>>
{
    public async Task<Result<List<GymHouseDto>>> Handle(GetGymHousesQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, currentUser.TenantId, Permission.ViewMembers, ct);
        if (!canView)
            return Result.Failure<List<GymHouseDto>>(new ForbiddenError().ToString());

        var houses = await gymHouseRepository.GetByOwnerIdAsync(currentUser.UserId, ct);

        return Result.Success(houses.Select(CreateGymHouseCommandHandler.ToDto).ToList());
    }
}
