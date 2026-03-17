using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Events;

public sealed record AnnouncementPublishedEvent(
    Guid AnnouncementId,
    Guid? GymHouseId,
    TargetAudience Audience)
    : IDomainEvent;
