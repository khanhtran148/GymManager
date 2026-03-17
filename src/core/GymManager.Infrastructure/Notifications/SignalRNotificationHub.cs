using GymManager.Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace GymManager.Infrastructure.Notifications;

/// <summary>
/// Implements INotificationHub using SignalR IHubContext.
/// The generic type parameter is provided by the API layer at registration time
/// so Infrastructure remains decoupled from the concrete Hub type.
/// </summary>
public sealed class SignalRNotificationHub<THub>(
    IHubContext<THub> hubContext,
    ILogger<SignalRNotificationHub<THub>> logger) : INotificationHub where THub : Hub
{
    public async Task SendToGroupAsync(
        string groupName, string method, object payload, CancellationToken ct = default)
    {
        logger.LogDebug("SignalR: sending method {Method} to group {Group}", method, groupName);
        await hubContext.Clients.Group(groupName).SendAsync(method, payload, ct);
    }
}
