using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Builders;

public sealed class NotificationDeliveryBuilder
{
    private Guid _announcementId = Guid.NewGuid();
    private Guid _recipientId = Guid.NewGuid();
    private NotificationChannel _channel = NotificationChannel.InApp;
    private DeliveryStatus _status = DeliveryStatus.Pending;
    private DateTime? _sentAt = null;
    private DateTime? _readAt = null;

    public NotificationDeliveryBuilder WithAnnouncementId(Guid id) { _announcementId = id; return this; }
    public NotificationDeliveryBuilder WithRecipientId(Guid id) { _recipientId = id; return this; }
    public NotificationDeliveryBuilder WithChannel(NotificationChannel channel) { _channel = channel; return this; }
    public NotificationDeliveryBuilder WithStatus(DeliveryStatus status) { _status = status; return this; }
    public NotificationDeliveryBuilder Sent() { _status = DeliveryStatus.Sent; _sentAt = DateTime.UtcNow; return this; }
    public NotificationDeliveryBuilder Read() { _status = DeliveryStatus.Read; _sentAt = DateTime.UtcNow; _readAt = DateTime.UtcNow; return this; }

    public NotificationDelivery Build() => new()
    {
        AnnouncementId = _announcementId,
        RecipientId = _recipientId,
        Channel = _channel,
        Status = _status,
        SentAt = _sentAt,
        ReadAt = _readAt
    };
}
