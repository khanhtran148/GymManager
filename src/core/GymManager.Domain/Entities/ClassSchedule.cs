using GymManager.Domain.Common;

namespace GymManager.Domain.Entities;

public sealed class ClassSchedule : AuditableEntity
{
    public Guid GymHouseId { get; set; }
    public Guid TrainerId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int MaxCapacity { get; set; }
    public int CurrentEnrollment { get; set; }
    public bool IsRecurring { get; set; }

    public GymHouse GymHouse { get; set; } = null!;
    public User Trainer { get; set; } = null!;
}
