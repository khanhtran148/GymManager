using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Entities;

public sealed class NotificationDelivery : AuditableEntity
{
    public Guid AnnouncementId { get; set; }
    public Guid RecipientId { get; set; }
    public NotificationChannel Channel { get; set; }
    public DeliveryStatus Status { get; set; } = DeliveryStatus.Pending;
    public DateTime? SentAt { get; set; }
    public DateTime? ReadAt { get; set; }

    public Announcement Announcement { get; set; } = null!;
    public User Recipient { get; set; } = null!;

    public void MarkRead(DateTime readAt)
    {
        Status = DeliveryStatus.Read;
        ReadAt = readAt;
    }

    public void MarkSent(DateTime sentAt)
    {
        Status = DeliveryStatus.Sent;
        SentAt = sentAt;
    }
}
