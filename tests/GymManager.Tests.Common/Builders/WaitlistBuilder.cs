using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Builders;

public sealed class WaitlistBuilder
{
    private Guid _memberId = Guid.NewGuid();
    private Guid _gymHouseId = Guid.NewGuid();
    private BookingType _bookingType = BookingType.TimeSlot;
    private Guid? _timeSlotId = null;
    private Guid? _classScheduleId = null;
    private int _position = 1;
    private DateTime _addedAt = DateTime.UtcNow;
    private Member? _member = null;

    public WaitlistBuilder WithMemberId(Guid memberId) { _memberId = memberId; return this; }
    public WaitlistBuilder WithGymHouseId(Guid gymHouseId) { _gymHouseId = gymHouseId; return this; }
    public WaitlistBuilder WithBookingType(BookingType bookingType) { _bookingType = bookingType; return this; }
    public WaitlistBuilder WithTimeSlotId(Guid timeSlotId) { _timeSlotId = timeSlotId; return this; }
    public WaitlistBuilder WithClassScheduleId(Guid classScheduleId) { _classScheduleId = classScheduleId; return this; }
    public WaitlistBuilder WithPosition(int position) { _position = position; return this; }
    public WaitlistBuilder WithAddedAt(DateTime addedAt) { _addedAt = addedAt; return this; }
    public WaitlistBuilder WithMember(Member member) { _member = member; _memberId = member.Id; return this; }

    public Waitlist Build()
    {
        var waitlist = new Waitlist
        {
            MemberId = _memberId,
            GymHouseId = _gymHouseId,
            BookingType = _bookingType,
            TimeSlotId = _timeSlotId,
            ClassScheduleId = _classScheduleId,
            Position = _position,
            AddedAt = _addedAt
        };
        if (_member is not null)
            waitlist.Member = _member;
        return waitlist;
    }
}
