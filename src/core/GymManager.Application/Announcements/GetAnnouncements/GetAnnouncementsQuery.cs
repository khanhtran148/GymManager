using CSharpFunctionalExtensions;
using GymManager.Application.Announcements.Shared;
using GymManager.Application.Common.Models;
using MediatR;

namespace GymManager.Application.Announcements.GetAnnouncements;

public sealed record GetAnnouncementsQuery(
    Guid GymHouseId,
    int Page,
    int PageSize)
    : IRequest<Result<PagedList<AnnouncementDto>>>;
