using GymManager.Domain.Common;

namespace GymManager.Domain.Events;

public sealed record SubscriptionCreatedEvent(
    Guid SubscriptionId,
    Guid MemberId,
    Guid GymHouseId,
    decimal Price) : IDomainEvent;
