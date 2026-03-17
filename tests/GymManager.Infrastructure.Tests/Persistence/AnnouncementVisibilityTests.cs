using FluentAssertions;
using GymManager.Tests.Common.Builders;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymManager.Infrastructure.Tests.Persistence;

public sealed class AnnouncementVisibilityTests : GymManager.Tests.Common.IntegrationTestBase
{
    [Fact]
    public async Task ChainWideAnnouncement_IsVisibleFromAnyHouseContext()
    {
        var owner = new UserBuilder().WithEmail("owner@example.com").Build();
        DbContext.Users.Add(owner);
        await DbContext.SaveChangesAsync();

        var chainWide = new AnnouncementBuilder()
            .AsChainWide()
            .WithAuthorId(owner.Id)
            .Published()
            .Build();
        DbContext.Announcements.Add(chainWide);
        await DbContext.SaveChangesAsync();

        var houseA = Guid.NewGuid();
        var houseB = Guid.NewGuid();

        // Simulate GetByHouseAsync filter: is_published AND (gym_house_id = x OR gym_house_id IS NULL)
        var visibleFromA = await DbContext.Announcements
            .Where(a => a.IsPublished && (a.GymHouseId == houseA || a.GymHouseId == null))
            .ToListAsync();

        var visibleFromB = await DbContext.Announcements
            .Where(a => a.IsPublished && (a.GymHouseId == houseB || a.GymHouseId == null))
            .ToListAsync();

        visibleFromA.Should().HaveCount(1);
        visibleFromA[0].Id.Should().Be(chainWide.Id);

        visibleFromB.Should().HaveCount(1);
        visibleFromB[0].Id.Should().Be(chainWide.Id);
    }

    [Fact]
    public async Task HouseScopedAnnouncement_IsNotVisibleFromOtherHouse()
    {
        var owner = new UserBuilder().WithEmail("owner2@example.com").Build();
        DbContext.Users.Add(owner);

        var houseAId = Guid.NewGuid();
        var houseBId = Guid.NewGuid();

        var houseScoped = new AnnouncementBuilder()
            .WithGymHouseId(houseAId)
            .WithAuthorId(owner.Id)
            .Published()
            .Build();
        DbContext.Announcements.Add(houseScoped);
        await DbContext.SaveChangesAsync();

        var visibleFromA = await DbContext.Announcements
            .Where(a => a.IsPublished && (a.GymHouseId == houseAId || a.GymHouseId == null))
            .ToListAsync();

        var visibleFromB = await DbContext.Announcements
            .Where(a => a.IsPublished && (a.GymHouseId == houseBId || a.GymHouseId == null))
            .ToListAsync();

        visibleFromA.Should().HaveCount(1);
        visibleFromA[0].Id.Should().Be(houseScoped.Id);

        visibleFromB.Should().BeEmpty();
    }

    [Fact]
    public async Task UnpublishedAnnouncement_IsNotReturnedByVisibilityQuery()
    {
        var owner = new UserBuilder().WithEmail("owner3@example.com").Build();
        DbContext.Users.Add(owner);

        var gymHouseId = Guid.NewGuid();
        var unpublished = new AnnouncementBuilder()
            .WithGymHouseId(gymHouseId)
            .WithAuthorId(owner.Id)
            .Build(); // not published

        DbContext.Announcements.Add(unpublished);
        await DbContext.SaveChangesAsync();

        var visible = await DbContext.Announcements
            .Where(a => a.IsPublished && (a.GymHouseId == gymHouseId || a.GymHouseId == null))
            .ToListAsync();

        visible.Should().BeEmpty();
    }
}
