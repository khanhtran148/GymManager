using CSharpFunctionalExtensions;
using GymManager.Application.Notifications.Shared;
using MediatR;

namespace GymManager.Application.Notifications.GetPreferences;

public sealed record GetNotificationPreferencesQuery()
    : IRequest<Result<List<NotificationPreferenceDto>>>;
