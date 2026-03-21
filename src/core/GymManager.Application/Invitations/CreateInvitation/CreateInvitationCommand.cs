using CSharpFunctionalExtensions;
using GymManager.Application.Invitations.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Invitations.CreateInvitation;

public sealed record CreateInvitationCommand(
    string Email,
    Role Role,
    Guid GymHouseId) : IRequest<Result<InvitationDto>>;
