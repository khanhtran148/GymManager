using GymManager.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace GymManager.Infrastructure.Notifications;

/// <summary>
/// Implements INotificationHub using SignalR IHubContext.
/// The generic type parameter is provided by the API layer at registration time.
/// This service is registered as a factory to remain decoupled from the concrete Hub type.
/// </summary>
public sealed class SignalRNotificationHub(
    IHubContext hubContext,
    ILogger<SignalRNotificationHub> logger) : INotificationHub
{
    public async Task SendToGroupAsync(
        string groupName, string method, object payload, CancellationToken ct = default)
    {
        logger.LogDebug("SignalR: sending method {Method} to group {Group}", method, groupName);
        await hubContext.Clients.Group(groupName).SendAsync(method, payload, ct);
    }
}
