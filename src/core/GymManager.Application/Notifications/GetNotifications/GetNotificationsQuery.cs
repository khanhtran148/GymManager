using CSharpFunctionalExtensions;
using GymManager.Application.Common.Models;
using GymManager.Application.Notifications.Shared;
using MediatR;

namespace GymManager.Application.Notifications.GetNotifications;

public sealed record GetNotificationsQuery(
    Guid RecipientId,
    int Page,
    int PageSize)
    : IRequest<Result<PagedList<NotificationDto>>>;
