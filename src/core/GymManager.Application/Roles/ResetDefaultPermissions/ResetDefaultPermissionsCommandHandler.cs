using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Roles.Shared;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using MediatR;

namespace GymManager.Application.Roles.ResetDefaultPermissions;

public sealed class ResetDefaultPermissionsCommandHandler(
    IRolePermissionRepository rolePermissionRepository,
    IUserRepository userRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser,
    IPublisher publisher)
    : IRequestHandler<ResetDefaultPermissionsCommand, Result>
{
    public async Task<Result> Handle(ResetDefaultPermissionsCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, currentUser.TenantId, Permission.ManageRoles, ct);
        if (!canManage)
            return Result.Failure(new ForbiddenError().ToString());

        var tenantId = currentUser.TenantId;
        var defaults = RolePermissionDefaults.GetDefaultRolePermissions(tenantId);

        await rolePermissionRepository.UpsertRangeAsync(defaults, ct);

        // Publish PermissionsChangedEvent for all non-Owner users within this tenant
        var publishTasks = new List<Task>();
        foreach (var role in new[] { Role.HouseManager, Role.Trainer, Role.Staff, Role.Member })
        {
            var defaultPermissions = (long)RolePermissionDefaults.GetDefaultPermissions(role);
            var affectedUsers = await userRepository.GetByTenantAndRoleAsync(tenantId, role, ct);
            publishTasks.AddRange(affectedUsers.Select(user =>
                publisher.Publish(
                    new PermissionsChangedEvent(user.Id, role.ToString(), defaultPermissions),
                    ct)));
        }
        await Task.WhenAll(publishTasks);

        return Result.Success();
    }
}
