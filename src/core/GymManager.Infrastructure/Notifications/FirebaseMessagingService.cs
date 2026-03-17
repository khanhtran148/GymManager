using GymManager.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace GymManager.Infrastructure.Notifications;

/// <summary>
/// Wraps Firebase Admin SDK for push notification multicast delivery.
/// Firebase Admin SDK package (FirebaseAdmin) should be added when FCM credentials are configured.
/// This implementation uses a no-op/log-only mode when FCM is not configured.
/// </summary>
public sealed class FirebaseMessagingService(ILogger<FirebaseMessagingService> logger) : IFirebaseMessagingService
{
    public async Task SendMulticastAsync(
        IEnumerable<string> deviceTokens,
        string title,
        string body,
        CancellationToken ct = default)
    {
        var tokens = deviceTokens.ToList();

        if (tokens.Count == 0)
        {
            logger.LogDebug("SendMulticastAsync called with no device tokens; skipping.");
            return;
        }

        // Production: integrate FirebaseAdmin.Messaging.FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(...)
        // For now, log the outbound call. Replace with real FCM SDK call once credentials are provisioned.
        logger.LogInformation(
            "FCM multicast: sending to {TokenCount} device(s). Title={Title}",
            tokens.Count,
            title);

        await Task.CompletedTask;
    }
}
