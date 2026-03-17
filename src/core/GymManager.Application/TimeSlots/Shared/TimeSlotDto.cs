namespace GymManager.Application.TimeSlots.Shared;

public sealed record TimeSlotDto(
    Guid Id,
    Guid GymHouseId,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int MaxCapacity,
    int CurrentBookings,
    int AvailableSpots);
