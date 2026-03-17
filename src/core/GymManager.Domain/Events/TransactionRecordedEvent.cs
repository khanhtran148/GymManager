using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Events;

public sealed record TransactionRecordedEvent(
    Guid TransactionId,
    Guid GymHouseId,
    TransactionType Type,
    decimal Amount) : IDomainEvent;
