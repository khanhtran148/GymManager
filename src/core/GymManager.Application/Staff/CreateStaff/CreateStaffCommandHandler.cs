using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Staff.Shared;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using Mapster;
using MediatR;

namespace GymManager.Application.Staff.CreateStaff;

public sealed class CreateStaffCommandHandler(
    IStaffRepository staffRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser,
    IPublisher publisher)
    : IRequestHandler<CreateStaffCommand, Result<StaffDto>>
{
    public async Task<Result<StaffDto>> Handle(CreateStaffCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageStaff, ct);
        if (!canManage)
            return Result.Failure<StaffDto>(new ForbiddenError().ToString());

        var exists = await staffRepository.ExistsAsync(request.UserId, request.GymHouseId, ct);
        if (exists)
            return Result.Failure<StaffDto>(new ConflictError("Staff already exists for this user at this gym house.").ToString());

        var staff = new Domain.Entities.Staff
        {
            UserId = request.UserId,
            GymHouseId = request.GymHouseId,
            StaffType = request.StaffType,
            BaseSalary = request.BaseSalary,
            PerClassBonus = request.PerClassBonus,
            HiredAt = DateTime.UtcNow
        };

        await staffRepository.CreateAsync(staff, ct);

        await publisher.Publish(new StaffCreatedEvent(staff.Id, staff.UserId, staff.GymHouseId), ct);

        var created = await staffRepository.GetByIdAsync(staff.Id, request.GymHouseId, ct);
        return Result.Success(created!.Adapt<StaffDto>());
    }
}
