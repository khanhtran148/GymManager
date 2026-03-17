using GymManager.Domain.Entities;

namespace GymManager.Tests.Common.Builders;

public sealed class TimeSlotBuilder
{
    private Guid _gymHouseId = Guid.NewGuid();
    private DateOnly _date = DateOnly.FromDateTime(DateTime.UtcNow);
    private TimeOnly _startTime = new(9, 0);
    private TimeOnly _endTime = new(10, 0);
    private int _maxCapacity = 20;
    private int _currentBookings = 0;

    public TimeSlotBuilder WithGymHouseId(Guid gymHouseId) { _gymHouseId = gymHouseId; return this; }
    public TimeSlotBuilder WithDate(DateOnly date) { _date = date; return this; }
    public TimeSlotBuilder WithStartTime(TimeOnly startTime) { _startTime = startTime; return this; }
    public TimeSlotBuilder WithEndTime(TimeOnly endTime) { _endTime = endTime; return this; }
    public TimeSlotBuilder WithMaxCapacity(int maxCapacity) { _maxCapacity = maxCapacity; return this; }
    public TimeSlotBuilder WithCurrentBookings(int currentBookings) { _currentBookings = currentBookings; return this; }

    public TimeSlot Build() => new()
    {
        GymHouseId = _gymHouseId,
        Date = _date,
        StartTime = _startTime,
        EndTime = _endTime,
        MaxCapacity = _maxCapacity,
        CurrentBookings = _currentBookings
    };
}
