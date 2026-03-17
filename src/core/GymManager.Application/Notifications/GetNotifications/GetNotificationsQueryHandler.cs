using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Notifications.Shared;
using MediatR;

namespace GymManager.Application.Notifications.GetNotifications;

public sealed class GetNotificationsQueryHandler(
    INotificationDeliveryRepository deliveryRepository,
    ICurrentUser currentUser)
    : IRequestHandler<GetNotificationsQuery, Result<PagedList<NotificationDto>>>
{
    public async Task<Result<PagedList<NotificationDto>>> Handle(
        GetNotificationsQuery request, CancellationToken ct)
    {
        if (request.RecipientId != currentUser.UserId)
            return Result.Failure<PagedList<NotificationDto>>(new ForbiddenError().ToString());

        var paged = await deliveryRepository.GetByRecipientAsync(
            request.RecipientId, request.Page, request.PageSize, ct);

        var dtos = paged.Items.Select(d => new NotificationDto(
            d.Id,
            d.AnnouncementId,
            d.Announcement?.Title ?? string.Empty,
            d.Announcement?.Content ?? string.Empty,
            d.Channel,
            d.Status,
            d.SentAt,
            d.ReadAt)).ToList();

        return Result.Success(new PagedList<NotificationDto>(
            dtos, paged.TotalCount, paged.Page, paged.PageSize));
    }
}
