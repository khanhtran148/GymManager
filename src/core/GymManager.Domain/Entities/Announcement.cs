using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Entities;

public sealed class Announcement : AuditableEntity
{
    public Guid? GymHouseId { get; set; }
    public Guid AuthorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public TargetAudience TargetAudience { get; set; }
    public DateTime PublishAt { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }

    public User Author { get; set; } = null!;

    public void Publish(DateTime publishedAt)
    {
        IsPublished = true;
        PublishedAt = publishedAt;
    }
}
