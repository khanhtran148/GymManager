using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Application.Common.Interfaces;

public interface IRolePermissionRepository
{
    Task<List<RolePermission>> GetByTenantAsync(Guid tenantId, CancellationToken ct = default);
    Task<RolePermission?> GetByTenantAndRoleAsync(Guid tenantId, Role role, CancellationToken ct = default);
    Task UpsertAsync(RolePermission rolePermission, CancellationToken ct = default);
    Task UpsertRangeAsync(IEnumerable<RolePermission> rolePermissions, CancellationToken ct = default);
    Task<bool> ExistsForTenantAsync(Guid tenantId, CancellationToken ct = default);
}
