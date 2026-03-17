using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.GymHouses.Shared;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.GymHouses.CreateGymHouse;

public sealed class CreateGymHouseCommandHandler(
    IGymHouseRepository gymHouseRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<CreateGymHouseCommand, Result<GymHouseDto>>
{
    public async Task<Result<GymHouseDto>> Handle(CreateGymHouseCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, currentUser.TenantId, Permission.ManageTenant, ct);
        if (!canManage)
            return Result.Failure<GymHouseDto>(new ForbiddenError().ToString());

        var gymHouse = new GymHouse
        {
            Name = request.Name,
            Address = request.Address,
            Phone = request.Phone,
            OperatingHours = request.OperatingHours,
            HourlyCapacity = request.HourlyCapacity,
            OwnerId = currentUser.UserId
        };

        await gymHouseRepository.CreateAsync(gymHouse, ct);

        return Result.Success(ToDto(gymHouse));
    }

    internal static GymHouseDto ToDto(GymHouse g) => new(
        g.Id, g.Name, g.Address, g.Phone, g.OperatingHours, g.HourlyCapacity, g.OwnerId, g.CreatedAt);
}
