using CSharpFunctionalExtensions;
using GymManager.Application.ClassSchedules.Shared;
using MediatR;

namespace GymManager.Application.ClassSchedules.UpdateClassSchedule;

public sealed record UpdateClassScheduleCommand(
    Guid Id,
    Guid GymHouseId,
    string ClassName,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int MaxCapacity,
    bool IsRecurring) : IRequest<Result<ClassScheduleDto>>;
