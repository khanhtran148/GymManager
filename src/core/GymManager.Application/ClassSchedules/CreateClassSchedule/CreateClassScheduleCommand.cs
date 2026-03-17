using CSharpFunctionalExtensions;
using GymManager.Application.ClassSchedules.Shared;
using MediatR;

namespace GymManager.Application.ClassSchedules.CreateClassSchedule;

public sealed record CreateClassScheduleCommand(
    Guid GymHouseId,
    Guid TrainerId,
    string ClassName,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int MaxCapacity,
    bool IsRecurring) : IRequest<Result<ClassScheduleDto>>;
