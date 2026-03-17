using CSharpFunctionalExtensions;
using GymManager.Application.Announcements.Shared;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Announcements.GetAnnouncementById;

public sealed class GetAnnouncementByIdQueryHandler(
    IAnnouncementRepository announcementRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetAnnouncementByIdQuery, Result<AnnouncementDto>>
{
    public async Task<Result<AnnouncementDto>> Handle(
        GetAnnouncementByIdQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewAnnouncements, ct);
        if (!canView)
            return Result.Failure<AnnouncementDto>(new ForbiddenError().ToString());

        var announcement = await announcementRepository.GetByIdAsync(request.Id, ct);
        if (announcement is null)
            return Result.Failure<AnnouncementDto>(new NotFoundError("Announcement", request.Id).ToString());

        // Enforce house visibility: announcement must belong to the queried house or be chain-wide
        if (announcement.GymHouseId is not null && announcement.GymHouseId != request.GymHouseId)
            return Result.Failure<AnnouncementDto>(new NotFoundError("Announcement", request.Id).ToString());

        return Result.Success(new AnnouncementDto(
            announcement.Id,
            announcement.GymHouseId,
            announcement.AuthorId,
            announcement.Author?.FullName ?? string.Empty,
            announcement.Title,
            announcement.Content,
            announcement.TargetAudience,
            announcement.PublishAt,
            announcement.IsPublished,
            announcement.PublishedAt,
            announcement.CreatedAt));
    }
}
