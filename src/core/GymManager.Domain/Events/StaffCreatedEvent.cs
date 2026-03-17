using GymManager.Domain.Common;

namespace GymManager.Domain.Events;

public sealed record StaffCreatedEvent(Guid StaffId, Guid UserId, Guid GymHouseId) : IDomainEvent;
