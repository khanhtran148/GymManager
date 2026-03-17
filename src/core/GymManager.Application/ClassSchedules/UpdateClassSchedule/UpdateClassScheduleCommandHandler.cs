using CSharpFunctionalExtensions;
using GymManager.Application.ClassSchedules.Shared;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using MediatR;
using static GymManager.Application.ClassSchedules.Shared.ClassScheduleMapper;

namespace GymManager.Application.ClassSchedules.UpdateClassSchedule;

public sealed class UpdateClassScheduleCommandHandler(
    IClassScheduleRepository classScheduleRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateClassScheduleCommand, Result<ClassScheduleDto>>
{
    public async Task<Result<ClassScheduleDto>> Handle(UpdateClassScheduleCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageSchedule, ct);
        if (!canManage)
            return Result.Failure<ClassScheduleDto>(new ForbiddenError().ToString());

        var classSchedule = await classScheduleRepository.GetByIdAsync(request.Id, ct);
        if (classSchedule is null)
            return Result.Failure<ClassScheduleDto>(new NotFoundError("ClassSchedule", request.Id).ToString());

        if (classSchedule.GymHouseId != request.GymHouseId)
            return Result.Failure<ClassScheduleDto>(new NotFoundError("ClassSchedule", request.Id).ToString());

        var hasConflict = await classScheduleRepository.HasTrainerConflictAsync(
            request.GymHouseId, classSchedule.TrainerId, request.DayOfWeek, request.StartTime, request.EndTime, request.Id, ct);
        if (hasConflict)
            return Result.Failure<ClassScheduleDto>(new ConflictError("Trainer is already assigned to another class during this time.").ToString());

        classSchedule.ClassName = request.ClassName;
        classSchedule.DayOfWeek = request.DayOfWeek;
        classSchedule.StartTime = request.StartTime;
        classSchedule.EndTime = request.EndTime;
        classSchedule.MaxCapacity = request.MaxCapacity;
        classSchedule.IsRecurring = request.IsRecurring;

        await classScheduleRepository.UpdateAsync(classSchedule, ct);

        return Result.Success(ToDto(classSchedule));
    }
}
