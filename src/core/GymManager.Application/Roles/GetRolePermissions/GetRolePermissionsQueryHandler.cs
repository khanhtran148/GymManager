using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Roles.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Roles.GetRolePermissions;

public sealed class GetRolePermissionsQueryHandler(
    IRolePermissionRepository rolePermissionRepository,
    ICurrentUser currentUser)
    : IRequestHandler<GetRolePermissionsQuery, Result<List<RolePermissionDto>>>
{
    public async Task<Result<List<RolePermissionDto>>> Handle(
        GetRolePermissionsQuery request, CancellationToken ct)
    {
        if (currentUser.Role != Role.Owner)
            return Result.Failure<List<RolePermissionDto>>(new ForbiddenError("Access denied.").ToString());

        var tenantId = currentUser.TenantId;

        // Lazy initialization: seed defaults on first access if no rows exist
        var exists = await rolePermissionRepository.ExistsForTenantAsync(tenantId, ct);
        if (!exists)
        {
            var defaults = RolePermissionDefaults.GetDefaultRolePermissions(tenantId);
            await rolePermissionRepository.UpsertRangeAsync(defaults, ct);
        }

        var rows = await rolePermissionRepository.GetByTenantAsync(tenantId, ct);

        var dtos = rows
            .OrderBy(r => (int)r.Role)
            .Select(r => new RolePermissionDto(
                r.Role.ToString(),
                (int)r.Role,
                ((long)r.Permissions).ToString(),
                GetPermissionNames(r.Permissions)))
            .ToList();

        return Result.Success(dtos);
    }

    private static List<string> GetPermissionNames(Permission permissions)
    {
        if (permissions == Permission.Admin)
            return ["Admin"];

        return Enum.GetValues<Permission>()
            .Where(p => p != Permission.None && p != Permission.Admin &&
                        (permissions & p) == p)
            .Select(p => p.ToString())
            .ToList();
    }
}
