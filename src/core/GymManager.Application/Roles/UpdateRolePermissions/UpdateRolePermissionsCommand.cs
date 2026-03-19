using CSharpFunctionalExtensions;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Roles.UpdateRolePermissions;

public sealed record UpdateRolePermissionsCommand(
    Role Role,
    string Permissions) : IRequest<Result>;
