using GymManager.Domain.Common;

namespace GymManager.Domain.Events;

public sealed record SubscriptionExpiredEvent(Guid SubscriptionId, Guid MemberId) : IDomainEvent;
