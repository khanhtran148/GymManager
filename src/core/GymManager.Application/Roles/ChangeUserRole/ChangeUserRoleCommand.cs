using CSharpFunctionalExtensions;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Roles.ChangeUserRole;

public sealed record ChangeUserRoleCommand(
    Guid UserId,
    Role Role) : IRequest<Result>;
