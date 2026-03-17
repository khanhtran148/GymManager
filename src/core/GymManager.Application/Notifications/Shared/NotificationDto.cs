using GymManager.Domain.Enums;

namespace GymManager.Application.Notifications.Shared;

public sealed record NotificationDto(
    Guid Id,
    Guid AnnouncementId,
    string AnnouncementTitle,
    string AnnouncementContent,
    NotificationChannel Channel,
    DeliveryStatus Status,
    DateTime? SentAt,
    DateTime? ReadAt);
