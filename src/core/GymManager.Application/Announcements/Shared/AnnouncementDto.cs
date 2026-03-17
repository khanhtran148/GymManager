using GymManager.Domain.Enums;

namespace GymManager.Application.Announcements.Shared;

public sealed record AnnouncementDto(
    Guid Id,
    Guid? GymHouseId,
    Guid AuthorId,
    string AuthorName,
    string Title,
    string Content,
    TargetAudience TargetAudience,
    DateTime PublishAt,
    bool IsPublished,
    DateTime? PublishedAt,
    DateTime CreatedAt);
