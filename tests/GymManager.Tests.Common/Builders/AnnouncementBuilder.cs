using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Builders;

public sealed class AnnouncementBuilder
{
    private Guid? _gymHouseId = Guid.NewGuid();
    private Guid _authorId = Guid.NewGuid();
    private string _title = "Test Announcement";
    private string _content = "Test announcement content.";
    private TargetAudience _targetAudience = TargetAudience.AllMembers;
    private DateTime _publishAt = DateTime.UtcNow.AddHours(1);
    private bool _isPublished = false;
    private DateTime? _publishedAt = null;

    public AnnouncementBuilder WithGymHouseId(Guid gymHouseId) { _gymHouseId = gymHouseId; return this; }
    public AnnouncementBuilder AsChainWide() { _gymHouseId = null; return this; }
    public AnnouncementBuilder WithAuthorId(Guid authorId) { _authorId = authorId; return this; }
    public AnnouncementBuilder WithTitle(string title) { _title = title; return this; }
    public AnnouncementBuilder WithContent(string content) { _content = content; return this; }
    public AnnouncementBuilder WithTargetAudience(TargetAudience audience) { _targetAudience = audience; return this; }
    public AnnouncementBuilder WithPublishAt(DateTime publishAt) { _publishAt = publishAt; return this; }
    public AnnouncementBuilder Published() { _isPublished = true; _publishedAt = DateTime.UtcNow; return this; }

    public Announcement Build() => new()
    {
        GymHouseId = _gymHouseId,
        AuthorId = _authorId,
        Title = _title,
        Content = _content,
        TargetAudience = _targetAudience,
        PublishAt = _publishAt,
        IsPublished = _isPublished,
        PublishedAt = _publishedAt
    };
}
