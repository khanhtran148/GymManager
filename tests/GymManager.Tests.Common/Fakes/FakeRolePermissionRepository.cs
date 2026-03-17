using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Fakes;

public sealed class FakeRolePermissionRepository : IRolePermissionRepository
{
    private readonly List<RolePermission> _store = [];

    public void Seed(params RolePermission[] items) => _store.AddRange(items);

    public Task<List<RolePermission>> GetByTenantAsync(Guid tenantId, CancellationToken ct = default) =>
        Task.FromResult(_store.Where(rp => rp.TenantId == tenantId).ToList());

    public Task<RolePermission?> GetByTenantAndRoleAsync(Guid tenantId, Role role, CancellationToken ct = default) =>
        Task.FromResult(_store.FirstOrDefault(rp => rp.TenantId == tenantId && rp.Role == role));

    public Task UpsertAsync(RolePermission rolePermission, CancellationToken ct = default)
    {
        var existing = _store.FirstOrDefault(rp => rp.TenantId == rolePermission.TenantId && rp.Role == rolePermission.Role);
        if (existing is not null)
            existing.Permissions = rolePermission.Permissions;
        else
            _store.Add(rolePermission);
        return Task.CompletedTask;
    }

    public Task UpsertRangeAsync(IEnumerable<RolePermission> rolePermissions, CancellationToken ct = default)
    {
        foreach (var rp in rolePermissions)
        {
            var existing = _store.FirstOrDefault(x => x.TenantId == rp.TenantId && x.Role == rp.Role);
            if (existing is not null)
                existing.Permissions = rp.Permissions;
            else
                _store.Add(rp);
        }
        return Task.CompletedTask;
    }

    public Task<bool> ExistsForTenantAsync(Guid tenantId, CancellationToken ct = default) =>
        Task.FromResult(_store.Any(rp => rp.TenantId == tenantId));
}
