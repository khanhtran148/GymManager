using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Entities;

public sealed class Booking : AuditableEntity
{
    public Guid MemberId { get; set; }
    public Guid GymHouseId { get; set; }
    public BookingType BookingType { get; set; }
    public Guid? TimeSlotId { get; set; }
    public Guid? ClassScheduleId { get; set; }
    public BookingStatus Status { get; set; }
    public DateTime BookedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CheckedInAt { get; set; }
    public CheckInSource? CheckInSource { get; set; }

    public Member Member { get; set; } = null!;
    public GymHouse GymHouse { get; set; } = null!;
    public TimeSlot? TimeSlot { get; set; }
    public ClassSchedule? ClassSchedule { get; set; }

    public void CheckIn(CheckInSource source)
    {
        CheckedInAt = DateTime.UtcNow;
        CheckInSource = source;
        Status = BookingStatus.Completed;
    }

    public void Cancel()
    {
        Status = BookingStatus.Cancelled;
    }

    public void MarkNoShow()
    {
        Status = BookingStatus.NoShow;
    }

    public void Complete()
    {
        Status = BookingStatus.Completed;
    }
}
