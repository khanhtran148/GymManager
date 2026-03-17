using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GymManager.Application.Tests.Jobs;

// Tests validate AnnouncementPublisherJob logic by exercising the announcement repository directly.
// The Quartz infrastructure (IPublishEndpoint, IServiceScopeFactory) is out-of-process;
// we test the core due-announcement selection and publish logic in-process.
public sealed class AnnouncementPublisherJobTests : ApplicationTestBase
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
    public async Task AnnouncementPublisherJob_PublishesDueAnnouncements()
    {
        var (ownerId, gymHouseId) = await SetupOwnerAndHouseAsync();
        var announcementRepo = Services.GetRequiredService<IAnnouncementRepository>();

        var dueAnnouncement = new Announcement
        {
            GymHouseId = gymHouseId,
            AuthorId = ownerId,
            Title = "Due Now",
            Content = "Should be published",
            TargetAudience = TargetAudience.AllMembers,
            PublishAt = DateTime.UtcNow.AddMinutes(-5), // overdue
            IsPublished = false
        };
        await announcementRepo.CreateAsync(dueAnnouncement);

        // Simulate job logic
        var dueAnnouncements = await announcementRepo.GetDueForPublishingAsync(DateTime.UtcNow);
        dueAnnouncements.Should().Contain(a => a.Id == dueAnnouncement.Id);

        foreach (var a in dueAnnouncements.Where(x => x.Id == dueAnnouncement.Id))
        {
            a.Publish(DateTime.UtcNow);
            await announcementRepo.UpdateAsync(a);
        }

        var updated = await announcementRepo.GetByIdAsync(dueAnnouncement.Id);
        updated!.IsPublished.Should().BeTrue();
        updated.PublishedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task AnnouncementPublisherJob_SkipsAlreadyPublishedAnnouncements()
    {
        var (ownerId, gymHouseId) = await SetupOwnerAndHouseAsync();
        var announcementRepo = Services.GetRequiredService<IAnnouncementRepository>();

        var published = new Announcement
        {
            GymHouseId = gymHouseId,
            AuthorId = ownerId,
            Title = "Already Published",
            Content = "Content",
            TargetAudience = TargetAudience.AllMembers,
            PublishAt = DateTime.UtcNow.AddMinutes(-10),
            IsPublished = true,
            PublishedAt = DateTime.UtcNow.AddMinutes(-10)
        };
        await announcementRepo.CreateAsync(published);

        // GetDueForPublishingAsync should NOT return already-published announcements
        var due = await announcementRepo.GetDueForPublishingAsync(DateTime.UtcNow);
        due.Should().NotContain(a => a.Id == published.Id);
    }

    [Fact]
    public async Task AnnouncementPublisherJob_SkipsFutureAnnouncements()
    {
        var (ownerId, gymHouseId) = await SetupOwnerAndHouseAsync();
        var announcementRepo = Services.GetRequiredService<IAnnouncementRepository>();

        var future = new Announcement
        {
            GymHouseId = gymHouseId,
            AuthorId = ownerId,
            Title = "Future",
            Content = "Content",
            TargetAudience = TargetAudience.AllMembers,
            PublishAt = DateTime.UtcNow.AddHours(2), // future
            IsPublished = false
        };
        await announcementRepo.CreateAsync(future);

        var due = await announcementRepo.GetDueForPublishingAsync(DateTime.UtcNow);
        due.Should().NotContain(a => a.Id == future.Id);
    }
}
