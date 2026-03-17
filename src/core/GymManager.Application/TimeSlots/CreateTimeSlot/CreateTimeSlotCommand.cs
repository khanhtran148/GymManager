using CSharpFunctionalExtensions;
using GymManager.Application.TimeSlots.Shared;
using MediatR;

namespace GymManager.Application.TimeSlots.CreateTimeSlot;

public sealed record CreateTimeSlotCommand(
    Guid GymHouseId,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int MaxCapacity) : IRequest<Result<TimeSlotDto>>;
