using FluentAssertions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Notifications.MarkNotificationRead;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GymManager.Application.Tests.Notifications;

public sealed class MarkNotificationReadCommandHandlerTests : ApplicationTestBase
{
    private async Task<(Guid UserId, Guid GymHouseId)> SetupUserAndHouseAsync()
    {
        var (owner, gymHouse) = await CreateOwnerAsync(
            $"owner{Guid.NewGuid()}@example.com", "Notification Test Gym");
        return (owner.Id, gymHouse.Id);
    }

    private async Task<Guid> CreateNotificationDeliveryAsync(Guid recipientId, Guid gymHouseId)
    {
        var announcementRepo = Services.GetRequiredService<IAnnouncementRepository>();
        var deliveryRepo = Services.GetRequiredService<INotificationDeliveryRepository>();

        var announcement = new Announcement
        {
            GymHouseId = gymHouseId,
            AuthorId = recipientId,
            Title = "Test",
            Content = "Content",
            TargetAudience = TargetAudience.AllMembers,
            PublishAt = DateTime.UtcNow.AddHours(1)
        };
        await announcementRepo.CreateAsync(announcement);

        var delivery = new NotificationDelivery
        {
            AnnouncementId = announcement.Id,
            RecipientId = recipientId,
            Channel = NotificationChannel.InApp,
            Status = DeliveryStatus.Sent,
            SentAt = DateTime.UtcNow
        };
        await deliveryRepo.CreateBatchAsync([delivery]);
        return delivery.Id;
    }

    [Fact]
    public async Task MarkNotificationRead_OwnNotification_SetsReadAt()
    {
        var (userId, gymHouseId) = await SetupUserAndHouseAsync();
        var deliveryId = await CreateNotificationDeliveryAsync(userId, gymHouseId);

        var command = new MarkNotificationReadCommand(deliveryId);
        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();

        var deliveryRepo = Services.GetRequiredService<INotificationDeliveryRepository>();
        var updated = await deliveryRepo.GetByIdAsync(deliveryId);
        updated!.Status.Should().Be(DeliveryStatus.Read);
        updated.ReadAt.Should().NotBeNull();
    }

    [Fact]
    public async Task MarkNotificationRead_OtherUsersNotification_ReturnsForbidden()
    {
        var (userId, gymHouseId) = await SetupUserAndHouseAsync();
        var deliveryId = await CreateNotificationDeliveryAsync(userId, gymHouseId);

        var otherUserId = Guid.NewGuid();
        CurrentUser.UserId = otherUserId;
        var command = new MarkNotificationReadCommand(deliveryId);
        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.ToLower().Should().Contain("access denied");
    }

    [Fact]
    public async Task MarkNotificationRead_NonExistentNotification_ReturnsNotFound()
    {
        var (userId, _) = await SetupUserAndHouseAsync();

        var command = new MarkNotificationReadCommand(Guid.NewGuid());
        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.ToLower().Should().Contain("not found");
    }
}
