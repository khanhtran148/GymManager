using CSharpFunctionalExtensions;
using GymManager.Application.Common.Models;
using GymManager.Application.Notifications.Shared;
using MediatR;

namespace GymManager.Application.Notifications.GetNotifications;

public sealed record GetNotificationsQuery(
    int Page,
    int PageSize)
    : IRequest<Result<PagedList<NotificationDto>>>;
