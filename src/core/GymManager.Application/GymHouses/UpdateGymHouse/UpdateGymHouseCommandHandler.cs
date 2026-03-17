using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.GymHouses.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.GymHouses.UpdateGymHouse;

public sealed class UpdateGymHouseCommandHandler(
    IGymHouseRepository gymHouseRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateGymHouseCommand, Result<GymHouseDto>>
{
    public async Task<Result<GymHouseDto>> Handle(UpdateGymHouseCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, currentUser.TenantId, Permission.ManageTenant, ct);
        if (!canManage)
            return Result.Failure<GymHouseDto>(new ForbiddenError().ToString());

        var gymHouse = await gymHouseRepository.GetByIdAsync(request.Id, ct);
        if (gymHouse is null)
            return Result.Failure<GymHouseDto>(new NotFoundError(nameof(gymHouse), request.Id).ToString());

        gymHouse.Name = request.Name;
        gymHouse.Address = request.Address;
        gymHouse.Phone = request.Phone;
        gymHouse.OperatingHours = request.OperatingHours;
        gymHouse.HourlyCapacity = request.HourlyCapacity;

        await gymHouseRepository.UpdateAsync(gymHouse, ct);

        return Result.Success(CreateGymHouseCommandHandler.ToDto(gymHouse));
    }
}
