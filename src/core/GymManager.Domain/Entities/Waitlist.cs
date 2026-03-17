using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Entities;

public sealed class Waitlist : AuditableEntity
{
    public Guid MemberId { get; set; }
    public Guid GymHouseId { get; set; }
    public BookingType BookingType { get; set; }
    public Guid? TimeSlotId { get; set; }
    public Guid? ClassScheduleId { get; set; }
    public int Position { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PromotedAt { get; set; }

    public Member Member { get; set; } = null!;
    public GymHouse GymHouse { get; set; } = null!;
}
