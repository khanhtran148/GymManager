using CSharpFunctionalExtensions;
using GymManager.Application.Roles.Shared;
using MediatR;

namespace GymManager.Application.Roles.GetRolePermissions;

public sealed record GetRolePermissionsQuery : IRequest<Result<List<RolePermissionDto>>>;
