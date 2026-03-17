using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class RolePermissionRepository(GymManagerDbContext db) : IRolePermissionRepository
{
    public async Task<List<RolePermission>> GetByTenantAsync(Guid tenantId, CancellationToken ct = default) =>
        await db.RolePermissions
            .AsNoTracking()
            .Where(rp => rp.TenantId == tenantId)
            .ToListAsync(ct);

    public async Task<RolePermission?> GetByTenantAndRoleAsync(Guid tenantId, Role role, CancellationToken ct = default) =>
        await db.RolePermissions
            .AsNoTracking()
            .FirstOrDefaultAsync(rp => rp.TenantId == tenantId && rp.Role == role, ct);

    public async Task UpsertAsync(RolePermission rolePermission, CancellationToken ct = default)
    {
        var existing = await db.RolePermissions
            .FirstOrDefaultAsync(rp => rp.TenantId == rolePermission.TenantId && rp.Role == rolePermission.Role, ct);

        if (existing is not null)
        {
            existing.Permissions = rolePermission.Permissions;
        }
        else
        {
            db.RolePermissions.Add(rolePermission);
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task UpsertRangeAsync(IEnumerable<RolePermission> rolePermissions, CancellationToken ct = default)
    {
        var incoming = rolePermissions.ToList();
        if (incoming.Count == 0)
            return;

        // Assume all entries share the same tenantId (they always do in the callers)
        var tenantId = incoming[0].TenantId;

        // Fetch all existing rows for this tenant in a single query
        var existingRows = await db.RolePermissions
            .Where(x => x.TenantId == tenantId)
            .ToListAsync(ct);

        var existingByRole = existingRows.ToDictionary(x => x.Role);

        foreach (var rp in incoming)
        {
            if (existingByRole.TryGetValue(rp.Role, out var existing))
            {
                existing.Permissions = rp.Permissions;
            }
            else
            {
                db.RolePermissions.Add(rp);
            }
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task<bool> ExistsForTenantAsync(Guid tenantId, CancellationToken ct = default) =>
        await db.RolePermissions
            .AnyAsync(rp => rp.TenantId == tenantId, ct);
}
