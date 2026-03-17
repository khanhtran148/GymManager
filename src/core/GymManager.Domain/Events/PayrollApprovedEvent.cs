using GymManager.Domain.Common;

namespace GymManager.Domain.Events;

public sealed record PayrollApprovedEvent(Guid PayrollPeriodId, Guid GymHouseId) : IDomainEvent;
