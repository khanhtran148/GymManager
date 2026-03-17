using CSharpFunctionalExtensions;
using GymManager.Application.Announcements.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Announcements.CreateAnnouncement;

public sealed record CreateAnnouncementCommand(
    Guid? GymHouseId,
    Guid AuthorId,
    string Title,
    string Content,
    TargetAudience TargetAudience,
    DateTime PublishAt)
    : IRequest<Result<AnnouncementDto>>;
