using GymManager.Domain.Enums;

namespace GymManager.Application.Bookings.Shared;

public sealed record BookingDto(
    Guid Id,
    Guid MemberId,
    Guid GymHouseId,
    BookingType BookingType,
    Guid? TimeSlotId,
    Guid? ClassScheduleId,
    BookingStatus Status,
    DateTime BookedAt,
    DateTime? CheckedInAt,
    CheckInSource? CheckInSource,
    string MemberName,
    string MemberCode);
