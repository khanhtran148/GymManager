using GymManager.Domain.Enums;

namespace GymManager.Application.Notifications.Shared;

public sealed record NotificationPreferenceDto(
    NotificationChannel Channel,
    bool IsEnabled);
