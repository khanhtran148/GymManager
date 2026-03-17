using GymManager.Domain.Entities;

namespace GymManager.Application.Bookings.Shared;

internal static class BookingMapper
{
    public static BookingDto ToDto(Booking b, Member member) => new(
        b.Id,
        b.MemberId,
        b.GymHouseId,
        b.BookingType,
        b.TimeSlotId,
        b.ClassScheduleId,
        b.Status,
        b.BookedAt,
        b.CheckedInAt,
        b.CheckInSource,
        member.User?.FullName ?? string.Empty,
        member.MemberCode);
}
