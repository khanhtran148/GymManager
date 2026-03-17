using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace GymManager.BackgroundServices.Consumers;

public sealed class AnnouncementSignalRConsumer(
    IAnnouncementRepository announcementRepository,
    INotificationDeliveryRepository deliveryRepository,
    INotificationPreferenceRepository preferenceRepository,
    IUserRepository userRepository,
    INotificationHub notificationHub,
    ILogger<AnnouncementSignalRConsumer> logger) : IConsumer<AnnouncementPublishedEvent>
{
    public async Task Consume(ConsumeContext<AnnouncementPublishedEvent> context)
    {
        var evt = context.Message;
        var ct = context.CancellationToken;

        var announcement = await announcementRepository.GetByIdAsync(evt.AnnouncementId, ct);
        if (announcement is null)
        {
            logger.LogWarning("AnnouncementSignalRConsumer: announcement {Id} not found", evt.AnnouncementId);
            return;
        }

        // Resolve recipient users by audience + house
        var recipients = await ResolveRecipientsAsync(evt, ct);
        if (recipients.Count == 0)
        {
            logger.LogDebug("AnnouncementSignalRConsumer: no recipients for announcement {Id}", evt.AnnouncementId);
            return;
        }

        var deliveries = new List<NotificationDelivery>();

        foreach (var recipient in recipients)
        {
            // Check user preference for InApp channel
            var prefs = await preferenceRepository.GetByUserIdAsync(recipient.Id, ct);
            var inAppPref = prefs.FirstOrDefault(p => p.Channel == NotificationChannel.InApp);
            var inAppEnabled = inAppPref?.IsEnabled ?? true; // default enabled

            if (!inAppEnabled)
                continue;

            var delivery = new NotificationDelivery
            {
                AnnouncementId = evt.AnnouncementId,
                RecipientId = recipient.Id,
                Channel = NotificationChannel.InApp,
                Status = DeliveryStatus.Sent,
                SentAt = DateTime.UtcNow
            };
            deliveries.Add(delivery);
        }

        if (deliveries.Count > 0)
        {
            await deliveryRepository.CreateBatchAsync(deliveries, ct);
        }

        // Send SignalR notification to tenant group
        var groupName = evt.GymHouseId.HasValue
            ? $"tenant:{evt.GymHouseId}"
            : "tenant:all";

        var payload = new
        {
            announcementId = evt.AnnouncementId,
            title = announcement.Title,
            content = announcement.Content,
            channel = NotificationChannel.InApp.ToString()
        };

        if (evt.GymHouseId.HasValue)
        {
            await notificationHub.SendToGroupAsync(
                $"tenant:{evt.GymHouseId}", "ReceiveNotification", payload, ct);
        }
        else
        {
            // Chain-wide: send delivery records per recipient; SignalR broadcast is not feasible
            // without enumerating all tenant groups. Log and let individual user groups receive.
            logger.LogInformation(
                "AnnouncementSignalRConsumer: chain-wide announcement {Id}; SignalR per-user delivery created",
                evt.AnnouncementId);

            foreach (var delivery in deliveries)
            {
                var userPayload = new
                {
                    notificationId = delivery.Id,
                    announcementId = evt.AnnouncementId,
                    title = announcement.Title,
                    content = announcement.Content,
                    channel = NotificationChannel.InApp.ToString()
                };

                await notificationHub.SendToGroupAsync(
                    $"user:{delivery.RecipientId}", "ReceiveNotification", userPayload, ct);
            }
        }

        logger.LogInformation(
            "AnnouncementSignalRConsumer: created {Count} InApp deliveries for announcement {Id}",
            deliveries.Count,
            evt.AnnouncementId);
    }

    private async Task<List<GymManager.Domain.Entities.User>> ResolveRecipientsAsync(
        AnnouncementPublishedEvent evt, CancellationToken ct)
    {
        // Simplified: return users filtered by role matching the audience.
        // Full implementation would query Members/Staff tables by house + audience.
        return evt.Audience switch
        {
            TargetAudience.Everyone or TargetAudience.AllMembers or TargetAudience.ActiveMembers =>
                await userRepository.GetByRoleAndHouseAsync(Role.Member, evt.GymHouseId, ct),
            TargetAudience.Staff =>
                await userRepository.GetByRoleAndHouseAsync(Role.Staff, evt.GymHouseId, ct),
            TargetAudience.Trainers =>
                await userRepository.GetByRoleAndHouseAsync(Role.Trainer, evt.GymHouseId, ct),
            _ => []
        };
    }
}
