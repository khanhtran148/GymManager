using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Builders;

public sealed class BookingBuilder
{
    private Guid _memberId = Guid.NewGuid();
    private Guid _gymHouseId = Guid.NewGuid();
    private BookingType _bookingType = BookingType.TimeSlot;
    private Guid? _timeSlotId = null;
    private Guid? _classScheduleId = null;
    private BookingStatus _status = BookingStatus.Confirmed;
    private DateTime _bookedAt = DateTime.UtcNow;
    private Member? _member = null;

    public BookingBuilder WithMemberId(Guid memberId) { _memberId = memberId; return this; }
    public BookingBuilder WithGymHouseId(Guid gymHouseId) { _gymHouseId = gymHouseId; return this; }
    public BookingBuilder WithBookingType(BookingType bookingType) { _bookingType = bookingType; return this; }
    public BookingBuilder WithTimeSlotId(Guid timeSlotId) { _timeSlotId = timeSlotId; _bookingType = BookingType.TimeSlot; return this; }
    public BookingBuilder WithClassScheduleId(Guid classScheduleId) { _classScheduleId = classScheduleId; _bookingType = BookingType.ClassSession; return this; }
    public BookingBuilder WithStatus(BookingStatus status) { _status = status; return this; }
    public BookingBuilder WithBookedAt(DateTime bookedAt) { _bookedAt = bookedAt; return this; }
    public BookingBuilder WithMember(Member member) { _member = member; _memberId = member.Id; return this; }

    public Booking Build()
    {
        var booking = new Booking
        {
            MemberId = _memberId,
            GymHouseId = _gymHouseId,
            BookingType = _bookingType,
            TimeSlotId = _timeSlotId,
            ClassScheduleId = _classScheduleId,
            Status = _status,
            BookedAt = _bookedAt
        };
        if (_member is not null)
            booking.Member = _member;
        return booking;
    }
}
