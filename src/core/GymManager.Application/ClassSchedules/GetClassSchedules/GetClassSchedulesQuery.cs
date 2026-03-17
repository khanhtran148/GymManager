using CSharpFunctionalExtensions;
using GymManager.Application.ClassSchedules.Shared;
using MediatR;

namespace GymManager.Application.ClassSchedules.GetClassSchedules;

public sealed record GetClassSchedulesQuery(
    Guid GymHouseId,
    DayOfWeek? DayOfWeek) : IRequest<Result<List<ClassScheduleDto>>>;
