using CSharpFunctionalExtensions;
using GymManager.Application.TimeSlots.Shared;
using MediatR;

namespace GymManager.Application.TimeSlots.GetTimeSlots;

public sealed record GetTimeSlotsQuery(
    Guid GymHouseId,
    DateOnly? From,
    DateOnly? To) : IRequest<Result<List<TimeSlotDto>>>;
