using CSharpFunctionalExtensions;
using GymManager.Application.ClassSchedules.Shared;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Mapster;
using MediatR;

namespace GymManager.Application.ClassSchedules.CreateClassSchedule;

public sealed class CreateClassScheduleCommandHandler(
    IClassScheduleRepository classScheduleRepository,
    IUserRepository userRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<CreateClassScheduleCommand, Result<ClassScheduleDto>>
{
    public async Task<Result<ClassScheduleDto>> Handle(CreateClassScheduleCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageSchedule, ct);
        if (!canManage)
            return Result.Failure<ClassScheduleDto>(new ForbiddenError().ToString());

        var trainer = await userRepository.GetByIdAsync(request.TrainerId, ct);
        if (trainer is null)
            return Result.Failure<ClassScheduleDto>(new NotFoundError("Trainer", request.TrainerId).ToString());

        var hasConflict = await classScheduleRepository.HasTrainerConflictAsync(
            request.GymHouseId, request.TrainerId, request.DayOfWeek, request.StartTime, request.EndTime, null, ct);
        if (hasConflict)
            return Result.Failure<ClassScheduleDto>(new ConflictError("Trainer is already assigned to another class during this time.").ToString());

        var classSchedule = new ClassSchedule
        {
            GymHouseId = request.GymHouseId,
            TrainerId = request.TrainerId,
            ClassName = request.ClassName,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            MaxCapacity = request.MaxCapacity,
            CurrentEnrollment = 0,
            IsRecurring = request.IsRecurring
        };

        await classScheduleRepository.CreateAsync(classSchedule, ct);

        var created = await classScheduleRepository.GetByIdAsync(classSchedule.Id, ct);
        return Result.Success(created!.Adapt<ClassScheduleDto>());
    }
}
