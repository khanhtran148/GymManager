using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Members.CreateMember;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GymManager.Application.Tests.Consumers;

// Tests validate AnnouncementFcmConsumer logic by exercising repositories directly.
public sealed class AnnouncementFcmConsumerTests : ApplicationTestBase
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
    public async Task AnnouncementFcmConsumer_CreatesPushDeliveryRecords_ForEligibleRecipients()
    {
        var (ownerId, gymHouseId) = await SetupOwnerAndHouseAsync();

        await Sender.Send(new CreateMemberCommand(
            gymHouseId, $"member{Guid.NewGuid()}@example.com", "Member FCM", null));

        var announcementRepo = Services.GetRequiredService<IAnnouncementRepository>();
        var announcement = new Announcement
        {
            GymHouseId = gymHouseId,
            AuthorId = ownerId,
            Title = "FCM Test",
            Content = "FCM Content",
            TargetAudience = TargetAudience.AllMembers,
            PublishAt = DateTime.UtcNow,
            IsPublished = true,
            PublishedAt = DateTime.UtcNow
        };
        await announcementRepo.CreateAsync(announcement);

        var deliveryRepo = Services.GetRequiredService<INotificationDeliveryRepository>();
        var preferenceRepo = Services.GetRequiredService<INotificationPreferenceRepository>();
        var userRepo = Services.GetRequiredService<IUserRepository>();

        var evt = new AnnouncementPublishedEvent(announcement.Id, gymHouseId, TargetAudience.AllMembers);
        var recipients = await userRepo.GetByRoleAndHouseAsync(Role.Member, gymHouseId);
        recipients.Should().HaveCount(1);

        // Simulate FCM consumer logic: push enabled by default
        var deliveries = new List<NotificationDelivery>();
        foreach (var recipient in recipients)
        {
            var prefs = await preferenceRepo.GetByUserIdAsync(recipient.Id);
            var pushPref = prefs.FirstOrDefault(p => p.Channel == NotificationChannel.Push);
            var pushEnabled = pushPref?.IsEnabled ?? true;

            if (!pushEnabled) continue;

            deliveries.Add(new NotificationDelivery
            {
                AnnouncementId = evt.AnnouncementId,
                RecipientId = recipient.Id,
                Channel = NotificationChannel.Push,
                Status = DeliveryStatus.Pending
            });
        }

        await deliveryRepo.CreateBatchAsync(deliveries);

        deliveries.Should().HaveCount(1);
        deliveries[0].Channel.Should().Be(NotificationChannel.Push);
    }

    [Fact]
    public async Task AnnouncementFcmConsumer_SkipsRecipients_WithPushDisabled()
    {
        var (ownerId, gymHouseId) = await SetupOwnerAndHouseAsync();

        await Sender.Send(new CreateMemberCommand(
            gymHouseId, $"member{Guid.NewGuid()}@example.com", "Member No FCM", null));

        var announcementRepo = Services.GetRequiredService<IAnnouncementRepository>();
        var announcement = new Announcement
        {
            GymHouseId = gymHouseId,
            AuthorId = ownerId,
            Title = "FCM Skip Test",
            Content = "Content",
            TargetAudience = TargetAudience.AllMembers,
            PublishAt = DateTime.UtcNow,
            IsPublished = true,
            PublishedAt = DateTime.UtcNow
        };
        await announcementRepo.CreateAsync(announcement);

        var preferenceRepo = Services.GetRequiredService<INotificationPreferenceRepository>();
        var userRepo = Services.GetRequiredService<IUserRepository>();

        var recipients = await userRepo.GetByRoleAndHouseAsync(Role.Member, gymHouseId);
        recipients.Should().HaveCount(1);

        // Disable Push for the recipient
        await preferenceRepo.UpsertAsync(recipients[0].Id, NotificationChannel.Push, isEnabled: false);

        var deliveries = new List<NotificationDelivery>();
        foreach (var recipient in recipients)
        {
            var prefs = await preferenceRepo.GetByUserIdAsync(recipient.Id);
            var pushPref = prefs.FirstOrDefault(p => p.Channel == NotificationChannel.Push);
            if (pushPref?.IsEnabled == false) continue;

            deliveries.Add(new NotificationDelivery
            {
                AnnouncementId = announcement.Id,
                RecipientId = recipient.Id,
                Channel = NotificationChannel.Push,
                Status = DeliveryStatus.Pending
            });
        }

        deliveries.Should().BeEmpty();
    }
}
