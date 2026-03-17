using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace GymManager.Api.EventHandlers;

public sealed class PermissionsChangedSignalRHandler(
    INotificationHub notificationHub,
    ILogger<PermissionsChangedSignalRHandler> logger) : INotificationHandler<PermissionsChangedEvent>
{
    public async Task Handle(PermissionsChangedEvent notification, CancellationToken cancellationToken)
    {
        var payload = new
        {
            UserId = notification.UserId.ToString(),
            NewRole = notification.NewRole,
            NewPermissions = notification.NewPermissions.ToString()
        };

        await notificationHub.SendToGroupAsync(
            $"user:{notification.UserId}",
            "PermissionsChanged",
            payload,
            cancellationToken);

        logger.LogInformation(
            "PermissionsChangedSignalRHandler: sent PermissionsChanged to user:{UserId} with role {NewRole}",
            notification.UserId,
            notification.NewRole);
    }
}
