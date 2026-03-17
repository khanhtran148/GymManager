using FluentAssertions;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Domain.Tests.Entities;

public sealed class AnnouncementTests
{
    [Fact]
    public void Announcement_ChainWide_HasNullGymHouseId()
    {
        var announcement = new Announcement
        {
            GymHouseId = null,
            Title = "Chain-Wide Announcement",
            Content = "Content",
            TargetAudience = TargetAudience.Everyone,
            PublishAt = DateTime.UtcNow.AddHours(1)
        };

        announcement.GymHouseId.Should().BeNull();
    }

    [Fact]
    public void Announcement_HouseScoped_HasGymHouseId()
    {
        var gymHouseId = Guid.NewGuid();
        var announcement = new Announcement
        {
            GymHouseId = gymHouseId,
            Title = "House Announcement",
            Content = "Content",
            TargetAudience = TargetAudience.AllMembers,
            PublishAt = DateTime.UtcNow.AddHours(1)
        };

        announcement.GymHouseId.Should().Be(gymHouseId);
    }

    [Fact]
    public void Publish_SetsIsPublishedTrue_AndPublishedAt()
    {
        var announcement = new Announcement
        {
            Title = "Test",
            Content = "Content",
            TargetAudience = TargetAudience.AllMembers,
            PublishAt = DateTime.UtcNow
        };

        var publishedAt = DateTime.UtcNow;
        announcement.Publish(publishedAt);

        announcement.IsPublished.Should().BeTrue();
        announcement.PublishedAt.Should().Be(publishedAt);
    }

    [Fact]
    public void Announcement_DefaultIsPublished_IsFalse()
    {
        var announcement = new Announcement();

        announcement.IsPublished.Should().BeFalse();
        announcement.PublishedAt.Should().BeNull();
    }

    [Theory]
    [InlineData(TargetAudience.AllMembers)]
    [InlineData(TargetAudience.ActiveMembers)]
    [InlineData(TargetAudience.Staff)]
    [InlineData(TargetAudience.Trainers)]
    [InlineData(TargetAudience.Everyone)]
    public void Announcement_AcceptsAllTargetAudienceValues(TargetAudience audience)
    {
        var announcement = new Announcement { TargetAudience = audience };

        announcement.TargetAudience.Should().Be(audience);
    }
}
