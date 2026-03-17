using GymManager.Domain.Common;

namespace GymManager.Domain.Events;

public sealed record MemberCreatedEvent(Guid MemberId, Guid GymHouseId) : IDomainEvent;
