using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Entities;

public sealed class ShiftAssignment : AuditableEntity
{
    public Guid StaffId { get; set; }
    public Guid GymHouseId { get; set; }
    public DateOnly ShiftDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public ShiftType ShiftType { get; set; }
    public ShiftStatus Status { get; set; } = ShiftStatus.Scheduled;

    public Staff Staff { get; set; } = null!;
    public GymHouse GymHouse { get; set; } = null!;
}
