using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using MediatR;

namespace GymManager.Application.Roles.UpdateRolePermissions;

public sealed class UpdateRolePermissionsCommandHandler(
    IRolePermissionRepository rolePermissionRepository,
    IUserRepository userRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser,
    IPublisher publisher)
    : IRequestHandler<UpdateRolePermissionsCommand, Result>
{
    public async Task<Result> Handle(UpdateRolePermissionsCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, currentUser.TenantId, Permission.ManageRoles, ct);
        if (!canManage)
            return Result.Failure(new ForbiddenError().ToString());

        if (request.Role == Role.Owner)
            return Result.Failure(new ConflictError("Owner role permissions cannot be modified.").ToString());

        if (!long.TryParse(request.Permissions, out var permissionBits))
            return Result.Failure(new ForbiddenError("Permissions must be a valid numeric bitmask.").ToString());

        var newPermissions = (Permission)permissionBits;

        var rolePermission = new RolePermission
        {
            TenantId = currentUser.TenantId,
            Role = request.Role,
            Permissions = newPermissions
        };

        await rolePermissionRepository.UpsertAsync(rolePermission, ct);

        // Publish PermissionsChangedEvent for each affected user within this tenant only
        var affectedUsers = await userRepository.GetByTenantAndRoleAsync(currentUser.TenantId, request.Role, ct);
        await Task.WhenAll(affectedUsers.Select(user =>
            publisher.Publish(
                new PermissionsChangedEvent(user.Id, request.Role.ToString(), permissionBits),
                ct)));

        return Result.Success();
    }
}
