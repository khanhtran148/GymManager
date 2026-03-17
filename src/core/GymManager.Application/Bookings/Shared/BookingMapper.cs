using GymManager.Domain.Entities;
using Mapster;

namespace GymManager.Application.Bookings.Shared;

internal static class BookingMapper
{
    public static BookingDto ToDto(Booking b, Member member)
    {
        var dto = b.Adapt<BookingDto>();
        return dto with
        {
            MemberName = member.User?.FullName ?? string.Empty,
            MemberCode = member.MemberCode
        };
    }
}
