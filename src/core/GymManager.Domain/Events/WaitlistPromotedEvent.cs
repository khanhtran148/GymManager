using GymManager.Domain.Common;

namespace GymManager.Domain.Events;

public sealed record WaitlistPromotedEvent(
    Guid WaitlistId,
    Guid BookingId,
    Guid MemberId) : IDomainEvent;
