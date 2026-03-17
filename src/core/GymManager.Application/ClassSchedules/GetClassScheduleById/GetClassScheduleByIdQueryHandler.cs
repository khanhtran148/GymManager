using CSharpFunctionalExtensions;
using GymManager.Application.ClassSchedules.Shared;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using MediatR;
using static GymManager.Application.ClassSchedules.Shared.ClassScheduleMapper;

namespace GymManager.Application.ClassSchedules.GetClassScheduleById;

public sealed class GetClassScheduleByIdQueryHandler(
    IClassScheduleRepository classScheduleRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetClassScheduleByIdQuery, Result<ClassScheduleDto>>
{
    public async Task<Result<ClassScheduleDto>> Handle(GetClassScheduleByIdQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewSchedule, ct);
        if (!canView)
            return Result.Failure<ClassScheduleDto>(new ForbiddenError().ToString());

        var classSchedule = await classScheduleRepository.GetByIdAsync(request.Id, ct);
        if (classSchedule is null)
            return Result.Failure<ClassScheduleDto>(new NotFoundError("ClassSchedule", request.Id).ToString());

        if (classSchedule.GymHouseId != request.GymHouseId)
            return Result.Failure<ClassScheduleDto>(new NotFoundError("ClassSchedule", request.Id).ToString());

        return Result.Success(ToDto(classSchedule));
    }
}
