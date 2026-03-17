using GymManager.Domain.Common;

namespace GymManager.Domain.Events;

public sealed record BookingConfirmedEvent(
    Guid BookingId,
    Guid MemberId,
    Guid GymHouseId) : IDomainEvent;
