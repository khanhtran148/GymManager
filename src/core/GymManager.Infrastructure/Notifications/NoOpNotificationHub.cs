using GymManager.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace GymManager.Infrastructure.Notifications;

/// <summary>
/// No-op implementation of INotificationHub for non-SignalR hosts (e.g., BackgroundServices).
/// Logs the call but does not deliver in real-time.
/// </summary>
public sealed class NoOpNotificationHub(
    ILogger<NoOpNotificationHub> logger) : INotificationHub
{
    public Task SendToGroupAsync(
        string groupName, string method, object payload, CancellationToken ct = default)
    {
        logger.LogDebug(
            "NoOpNotificationHub: skipped sending {Method} to group {Group} (no SignalR host)",
            method, groupName);
        return Task.CompletedTask;
    }
}
