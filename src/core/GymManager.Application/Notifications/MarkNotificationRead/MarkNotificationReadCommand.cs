using CSharpFunctionalExtensions;
using MediatR;

namespace GymManager.Application.Notifications.MarkNotificationRead;

public sealed record MarkNotificationReadCommand(
    Guid NotificationId)
    : IRequest<Result>;
