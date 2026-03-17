using CSharpFunctionalExtensions;
using GymManager.Application.Announcements.Shared;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Announcements.GetAnnouncements;

public sealed class GetAnnouncementsQueryHandler(
    IAnnouncementRepository announcementRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetAnnouncementsQuery, Result<PagedList<AnnouncementDto>>>
{
    public async Task<Result<PagedList<AnnouncementDto>>> Handle(
        GetAnnouncementsQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewAnnouncements, ct);
        if (!canView)
            return Result.Failure<PagedList<AnnouncementDto>>(new ForbiddenError().ToString());

        var paged = await announcementRepository.GetByHouseAsync(
            request.GymHouseId, request.Page, request.PageSize, ct);

        var dtos = paged.Items.Select(a => new AnnouncementDto(
            a.Id,
            a.GymHouseId,
            a.AuthorId,
            a.Author?.FullName ?? string.Empty,
            a.Title,
            a.Content,
            a.TargetAudience,
            a.PublishAt,
            a.IsPublished,
            a.PublishedAt,
            a.CreatedAt)).ToList();

        return Result.Success(new PagedList<AnnouncementDto>(
            dtos, paged.TotalCount, paged.Page, paged.PageSize));
    }
}
