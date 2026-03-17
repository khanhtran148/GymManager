using CSharpFunctionalExtensions;
using GymManager.Application.Announcements.Shared;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Announcements.CreateAnnouncement;

public sealed class CreateAnnouncementCommandHandler(
    IAnnouncementRepository announcementRepository,
    IUserRepository userRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<CreateAnnouncementCommand, Result<AnnouncementDto>>
{
    public async Task<Result<AnnouncementDto>> Handle(
        CreateAnnouncementCommand request, CancellationToken ct)
    {
        // 1. Permission check — ManageAnnouncements required
        var gymHouseIdForPermission = request.GymHouseId ?? currentUser.TenantId;
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, gymHouseIdForPermission, Permission.ManageAnnouncements, ct);
        if (!canManage)
            return Result.Failure<AnnouncementDto>(new ForbiddenError().ToString());

        // 2. Chain-wide announcements require Owner role
        if (request.GymHouseId is null)
        {
            var author = await userRepository.GetByIdAsync(request.AuthorId, ct);
            if (author is null || author.Role != Role.Owner)
                return Result.Failure<AnnouncementDto>(
                    new ForbiddenError("Only Owners can create chain-wide announcements.").ToString());
        }

        // 3. Resolve author name
        var authorUser = await userRepository.GetByIdAsync(request.AuthorId, ct);
        if (authorUser is null)
            return Result.Failure<AnnouncementDto>(new NotFoundError("User", request.AuthorId).ToString());

        // 4. Create entity
        var announcement = new Announcement
        {
            GymHouseId = request.GymHouseId,
            AuthorId = request.AuthorId,
            Title = request.Title,
            Content = request.Content,
            TargetAudience = request.TargetAudience,
            PublishAt = request.PublishAt,
            IsPublished = false
        };

        await announcementRepository.CreateAsync(announcement, ct);

        return Result.Success(new AnnouncementDto(
            announcement.Id,
            announcement.GymHouseId,
            announcement.AuthorId,
            authorUser.FullName,
            announcement.Title,
            announcement.Content,
            announcement.TargetAudience,
            announcement.PublishAt,
            announcement.IsPublished,
            announcement.PublishedAt,
            announcement.CreatedAt));
    }
}
