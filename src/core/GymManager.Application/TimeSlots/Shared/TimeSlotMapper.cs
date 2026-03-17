using GymManager.Domain.Entities;

namespace GymManager.Application.TimeSlots.Shared;

internal static class TimeSlotMapper
{
    public static TimeSlotDto ToDto(TimeSlot ts) => new(
        ts.Id,
        ts.GymHouseId,
        ts.Date,
        ts.StartTime,
        ts.EndTime,
        ts.MaxCapacity,
        ts.CurrentBookings,
        ts.MaxCapacity - ts.CurrentBookings);
}
