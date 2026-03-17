using GymManager.Domain.Common;

namespace GymManager.Domain.Entities;

public sealed class TimeSlot : AuditableEntity
{
    public Guid GymHouseId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int MaxCapacity { get; set; }
    public int CurrentBookings { get; set; }

    public GymHouse GymHouse { get; set; } = null!;
}
