using CSharpFunctionalExtensions;
using GymManager.Application.Announcements.Shared;
using MediatR;

namespace GymManager.Application.Announcements.GetAnnouncementById;

public sealed record GetAnnouncementByIdQuery(
    Guid Id,
    Guid GymHouseId)
    : IRequest<Result<AnnouncementDto>>;
