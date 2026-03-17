using CSharpFunctionalExtensions;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Notifications.UpdatePreferences;

public sealed record UpdateNotificationPreferencesCommand(
    Guid UserId,
    List<NotificationPreferenceItem> Preferences)
    : IRequest<Result>;

public sealed record NotificationPreferenceItem(
    NotificationChannel Channel,
    bool IsEnabled);
