using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Events;
using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Quartz;

namespace GymManager.BackgroundServices.Jobs;

[DisallowConcurrentExecution]
public sealed class AnnouncementPublisherJob(
    IServiceScopeFactory scopeFactory,
    ILogger<AnnouncementPublisherJob> logger) : IJob
{
    public async Task Execute(IJobExecutionContext context)
    {
        var ct = context.CancellationToken;

        using var scope = scopeFactory.CreateScope();
        var announcementRepo = scope.ServiceProvider.GetRequiredService<IAnnouncementRepository>();
        var publishEndpoint = scope.ServiceProvider.GetRequiredService<IPublishEndpoint>();

        var dueAnnouncements = await announcementRepo.GetDueForPublishingAsync(DateTime.UtcNow, ct);

        if (dueAnnouncements.Count == 0)
        {
            logger.LogDebug("AnnouncementPublisherJob: no announcements due for publishing");
            return;
        }

        logger.LogInformation(
            "AnnouncementPublisherJob: publishing {Count} due announcement(s)", dueAnnouncements.Count);

        foreach (var announcement in dueAnnouncements)
        {
            announcement.Publish(DateTime.UtcNow);
            await announcementRepo.UpdateAsync(announcement, ct);

            await publishEndpoint.Publish(
                new AnnouncementPublishedEvent(
                    announcement.Id,
                    announcement.GymHouseId,
                    announcement.TargetAudience),
                ct);

            logger.LogInformation(
                "AnnouncementPublisherJob: published announcement {Id} — {Title}",
                announcement.Id,
                announcement.Title);
        }
    }
}
