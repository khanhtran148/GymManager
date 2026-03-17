using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Entities;

public sealed class NotificationPreference : AuditableEntity
{
    public Guid UserId { get; set; }
    public NotificationChannel Channel { get; set; }
    public bool IsEnabled { get; set; } = true;

    public User User { get; set; } = null!;
}
