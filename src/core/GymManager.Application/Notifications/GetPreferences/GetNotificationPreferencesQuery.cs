using CSharpFunctionalExtensions;
using GymManager.Application.Notifications.Shared;
using MediatR;

namespace GymManager.Application.Notifications.GetPreferences;

public sealed record GetNotificationPreferencesQuery(
    Guid UserId)
    : IRequest<Result<List<NotificationPreferenceDto>>>;
