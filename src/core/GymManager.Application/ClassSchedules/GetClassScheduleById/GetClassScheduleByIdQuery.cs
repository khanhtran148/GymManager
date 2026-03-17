using CSharpFunctionalExtensions;
using GymManager.Application.ClassSchedules.Shared;
using MediatR;

namespace GymManager.Application.ClassSchedules.GetClassScheduleById;

public sealed record GetClassScheduleByIdQuery(
    Guid Id,
    Guid GymHouseId) : IRequest<Result<ClassScheduleDto>>;
