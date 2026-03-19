using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace GymManager.BackgroundServices.Consumers;

public sealed class AnnouncementFcmConsumer(
    IAnnouncementRepository announcementRepository,
    INotificationDeliveryRepository deliveryRepository,
    INotificationPreferenceRepository preferenceRepository,
    IUserRepository userRepository,
    IFirebaseMessagingService firebaseMessagingService,
    ILogger<AnnouncementFcmConsumer> logger) : IConsumer<AnnouncementPublishedEvent>
{
    public async Task Consume(ConsumeContext<AnnouncementPublishedEvent> context)
    {
        var evt = context.Message;
        var ct = context.CancellationToken;

        var announcement = await announcementRepository.GetByIdAsync(evt.AnnouncementId, ct);
        if (announcement is null)
        {
            logger.LogWarning("AnnouncementFcmConsumer: announcement {Id} not found", evt.AnnouncementId);
            return;
        }

        var recipients = await RecipientResolver.ResolveAsync(userRepository, evt, ct);
        if (recipients.Count == 0)
        {
            logger.LogDebug("AnnouncementFcmConsumer: no recipients for announcement {Id}", evt.AnnouncementId);
            return;
        }

        // Batch-fetch all notification preferences in a single query instead of one per recipient.
        var recipientIds = recipients.Select(r => r.Id).ToList();
        var allPrefs = await preferenceRepository.GetByUserIdsAsync(recipientIds, ct);
        var prefsByUser = allPrefs
            .GroupBy(p => p.UserId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var deliveries = new List<GymManager.Domain.Entities.NotificationDelivery>();
        var deviceTokens = new List<string>();

        foreach (var recipient in recipients)
        {
            prefsByUser.TryGetValue(recipient.Id, out var prefs);
            var pushPref = prefs?.FirstOrDefault(p => p.Channel == NotificationChannel.Push);
            var pushEnabled = pushPref?.IsEnabled ?? true;

            if (!pushEnabled)
                continue;

            // In a production system, device tokens would be stored on the User or a DeviceToken table.
            // Placeholder: skip if no token available.
            // TODO: integrate device token storage.
            var deviceToken = GetDeviceToken(recipient.Id);
            if (deviceToken is not null)
                deviceTokens.Add(deviceToken);

            var delivery = new GymManager.Domain.Entities.NotificationDelivery
            {
                AnnouncementId = evt.AnnouncementId,
                RecipientId = recipient.Id,
                Channel = NotificationChannel.Push,
                Status = DeliveryStatus.Pending,
            };
            deliveries.Add(delivery);
        }

        if (deliveries.Count > 0)
        {
            await deliveryRepository.CreateBatchAsync(deliveries, ct);
        }

        if (deviceTokens.Count > 0)
        {
            await firebaseMessagingService.SendMulticastAsync(
                deviceTokens, announcement.Title, announcement.Content, ct);

            foreach (var delivery in deliveries)
            {
                delivery.MarkSent(DateTime.UtcNow);
                await deliveryRepository.UpdateAsync(delivery, ct);
            }
        }

        logger.LogInformation(
            "AnnouncementFcmConsumer: processed {Count} Push deliveries for announcement {Id}",
            deliveries.Count,
            evt.AnnouncementId);
    }

    // Placeholder for device token lookup — replace with real storage lookup.
    private static string? GetDeviceToken(Guid userId) => null;
}
