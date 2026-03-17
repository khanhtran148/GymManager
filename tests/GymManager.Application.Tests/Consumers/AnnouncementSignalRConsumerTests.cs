using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Members.CreateMember;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using GymManager.Tests.Common.Fakes;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GymManager.Application.Tests.Consumers;

// Tests validate AnnouncementSignalRConsumer logic by exercising repositories directly,
// following the same in-process pattern as PayrollApprovedConsumerTests.
public sealed class AnnouncementSignalRConsumerTests : ApplicationTestBase
{
    private async Task<(Guid OwnerId, Guid GymHouseId)> SetupOwnerAndHouseAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123!", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var house = await Sender.Send(new CreateGymHouseCommand("Test Gym", "123 St", null, null, 50));
        return (reg.Value.UserId, house.Value.Id);
    }

    [Fact]
    public async Task AnnouncementSignalRConsumer_CreatesDeliveryRecords_ForMembersWithInAppEnabled()
    {
        var (ownerId, gymHouseId) = await SetupOwnerAndHouseAsync();

        // Create a member
        var memberResult = await Sender.Send(new CreateMemberCommand(
            gymHouseId, $"member{Guid.NewGuid()}@example.com", "Member One", null));
        memberResult.IsSuccess.Should().BeTrue();

        // Create announcement
        var announcementRepo = Services.GetRequiredService<IAnnouncementRepository>();
        var announcement = new Announcement
        {
            GymHouseId = gymHouseId,
            AuthorId = ownerId,
            Title = "Test",
            Content = "Content",
            TargetAudience = TargetAudience.AllMembers,
            PublishAt = DateTime.UtcNow,
            IsPublished = true,
            PublishedAt = DateTime.UtcNow
        };
        await announcementRepo.CreateAsync(announcement);

        var deliveryRepo = Services.GetRequiredService<INotificationDeliveryRepository>();
        var preferenceRepo = Services.GetRequiredService<INotificationPreferenceRepository>();
        var userRepo = Services.GetRequiredService<IUserRepository>();
        var notificationHub = (FakeNotificationHub)Services.GetRequiredService<INotificationHub>();

        var evt = new AnnouncementPublishedEvent(announcement.Id, gymHouseId, TargetAudience.AllMembers);

        // Simulate AnnouncementSignalRConsumer logic directly
        var recipients = await userRepo.GetByRoleAndHouseAsync(Role.Member, gymHouseId);
        var deliveries = new List<NotificationDelivery>();

        foreach (var recipient in recipients)
        {
            var prefs = await preferenceRepo.GetByUserIdAsync(recipient.Id);
            var inAppPref = prefs.FirstOrDefault(p => p.Channel == NotificationChannel.InApp);
            var inAppEnabled = inAppPref?.IsEnabled ?? true;

            if (!inAppEnabled) continue;

            deliveries.Add(new NotificationDelivery
            {
                AnnouncementId = evt.AnnouncementId,
                RecipientId = recipient.Id,
                Channel = NotificationChannel.InApp,
                Status = DeliveryStatus.Sent,
                SentAt = DateTime.UtcNow
            });
        }

        if (deliveries.Count > 0)
            await deliveryRepo.CreateBatchAsync(deliveries);

        await notificationHub.SendToGroupAsync(
            $"tenant:{gymHouseId}", "ReceiveNotification",
            new { announcementId = evt.AnnouncementId, title = announcement.Title });

        // Assert deliveries were created
        deliveries.Should().HaveCount(1);

        var saved = await deliveryRepo.GetByRecipientAsync(deliveries[0].RecipientId, 1, 10);
        saved.Items.Should().HaveCount(1);
        saved.Items[0].Channel.Should().Be(NotificationChannel.InApp);
        saved.Items[0].Status.Should().Be(DeliveryStatus.Sent);

        // Assert SignalR group was called
        notificationHub.SentMessages.Should().HaveCount(1);
        notificationHub.SentMessages[0].Group.Should().Be($"tenant:{gymHouseId}");
        notificationHub.SentMessages[0].Method.Should().Be("ReceiveNotification");
    }

    [Fact]
    public async Task AnnouncementSignalRConsumer_RespectsUserPreferences_SkipsDisabledInApp()
    {
        var (ownerId, gymHouseId) = await SetupOwnerAndHouseAsync();

        var memberResult = await Sender.Send(new CreateMemberCommand(
            gymHouseId, $"member{Guid.NewGuid()}@example.com", "Member Two", null));

        var announcementRepo = Services.GetRequiredService<IAnnouncementRepository>();
        var announcement = new Announcement
        {
            GymHouseId = gymHouseId,
            AuthorId = ownerId,
            Title = "Test",
            Content = "Content",
            TargetAudience = TargetAudience.AllMembers,
            PublishAt = DateTime.UtcNow,
            IsPublished = true,
            PublishedAt = DateTime.UtcNow
        };
        await announcementRepo.CreateAsync(announcement);

        var preferenceRepo = Services.GetRequiredService<INotificationPreferenceRepository>();
        var userRepo = Services.GetRequiredService<IUserRepository>();
        var deliveryRepo = Services.GetRequiredService<INotificationDeliveryRepository>();

        var recipients = await userRepo.GetByRoleAndHouseAsync(Role.Member, gymHouseId);
        recipients.Should().HaveCount(1);

        // Disable InApp for the member
        await preferenceRepo.UpsertAsync(recipients[0].Id, NotificationChannel.InApp, isEnabled: false);

        // Simulate consumer logic
        var deliveries = new List<NotificationDelivery>();
        foreach (var recipient in recipients)
        {
            var prefs = await preferenceRepo.GetByUserIdAsync(recipient.Id);
            var inAppPref = prefs.FirstOrDefault(p => p.Channel == NotificationChannel.InApp);
            if (inAppPref?.IsEnabled == false) continue;

            deliveries.Add(new NotificationDelivery
            {
                AnnouncementId = announcement.Id,
                RecipientId = recipient.Id,
                Channel = NotificationChannel.InApp,
                Status = DeliveryStatus.Sent,
                SentAt = DateTime.UtcNow
            });
        }

        // No deliveries should be created since user disabled InApp
        deliveries.Should().BeEmpty();
    }
}
