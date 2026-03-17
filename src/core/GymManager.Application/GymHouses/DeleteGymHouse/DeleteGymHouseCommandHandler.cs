using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.GymHouses.DeleteGymHouse;

public sealed class DeleteGymHouseCommandHandler(
    IGymHouseRepository gymHouseRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<DeleteGymHouseCommand, Result>
{
    public async Task<Result> Handle(DeleteGymHouseCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, currentUser.TenantId, Permission.ManageTenant, ct);
        if (!canManage)
            return Result.Failure(new ForbiddenError().ToString());

        var gymHouse = await gymHouseRepository.GetByIdAsync(request.Id, ct);
        if (gymHouse is null)
            return Result.Failure(new NotFoundError(nameof(gymHouse), request.Id).ToString());

        gymHouse.DeletedAt = DateTime.UtcNow;
        await gymHouseRepository.DeleteAsync(gymHouse, ct);

        return Result.Success();
    }
}
