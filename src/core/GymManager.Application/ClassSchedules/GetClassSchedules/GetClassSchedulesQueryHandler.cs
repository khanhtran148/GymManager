using CSharpFunctionalExtensions;
using GymManager.Application.ClassSchedules.Shared;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using Mapster;
using MediatR;

namespace GymManager.Application.ClassSchedules.GetClassSchedules;

public sealed class GetClassSchedulesQueryHandler(
    IClassScheduleRepository classScheduleRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetClassSchedulesQuery, Result<List<ClassScheduleDto>>>
{
    public async Task<Result<List<ClassScheduleDto>>> Handle(GetClassSchedulesQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewSchedule, ct);
        if (!canView)
            return Result.Failure<List<ClassScheduleDto>>(new ForbiddenError().ToString());

        var schedules = await classScheduleRepository.GetByGymHouseIdAsync(
            request.GymHouseId, request.DayOfWeek, ct);

        return Result.Success(schedules.Adapt<List<ClassScheduleDto>>());
    }
}
