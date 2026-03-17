using GymManager.Domain.Common;

namespace GymManager.Domain.Events;

public sealed record PermissionsChangedEvent(
    Guid UserId,
    string NewRole,
    long NewPermissions) : IDomainEvent;
