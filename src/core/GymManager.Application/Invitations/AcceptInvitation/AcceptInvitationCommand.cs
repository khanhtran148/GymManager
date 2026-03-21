using CSharpFunctionalExtensions;
using GymManager.Application.Auth.Shared;
using MediatR;

namespace GymManager.Application.Invitations.AcceptInvitation;

public sealed record AcceptInvitationCommand(
    string Token,
    string? Password,
    string? FullName) : IRequest<Result<AuthResponse>>;
