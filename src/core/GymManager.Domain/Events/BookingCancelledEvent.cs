using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Events;

public sealed record BookingCancelledEvent(
    Guid BookingId,
    Guid MemberId,
    Guid GymHouseId,
    BookingType Type,
    Guid? TimeSlotId,
    Guid? ClassScheduleId) : IDomainEvent;
