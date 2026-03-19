using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class UserRepository(GymManagerDbContext db) : IUserRepository
{
    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email && u.DeletedAt == null, ct);

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id && u.DeletedAt == null, ct);

    public async Task CreateAsync(User user, CancellationToken ct = default)
    {
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(User user, CancellationToken ct = default)
    {
        var tracked = await db.Users.FindAsync([user.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(user);
        }
        else
        {
            db.Users.Update(user);
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task<List<User>> GetByRoleAndHouseAsync(Role role, Guid? gymHouseId, CancellationToken ct = default)
    {
        if (gymHouseId.HasValue)
        {
            // Return users with the given role that are associated with the gym house via Members or Staff tables
            return await db.Users
                .AsNoTracking()
                .Where(u => u.Role == role && u.DeletedAt == null &&
                    (db.Members.Any(m => m.UserId == u.Id && m.GymHouseId == gymHouseId && m.DeletedAt == null) ||
                     db.Staff.Any(s => s.UserId == u.Id && s.GymHouseId == gymHouseId && s.DeletedAt == null)))
                .ToListAsync(ct);
        }

        // Chain-wide: all users with the given role
        return await db.Users
            .AsNoTracking()
            .Where(u => u.Role == role && u.DeletedAt == null)
            .ToListAsync(ct);
    }

    public async Task<List<User>> GetByTenantAndRoleAsync(Guid tenantId, Role role, CancellationToken ct = default)
    {
        // Collect all gym house IDs owned by this tenant
        var tenantGymHouseIds = db.GymHouses
            .Where(g => g.OwnerId == tenantId && g.DeletedAt == null)
            .Select(g => g.Id);

        // Return users with the given role whose membership or staff record is in one of the tenant's houses
        return await db.Users
            .AsNoTracking()
            .Where(u => u.Role == role && u.DeletedAt == null &&
                (db.Members.Any(m => m.UserId == u.Id && tenantGymHouseIds.Contains(m.GymHouseId) && m.DeletedAt == null) ||
                 db.Staff.Any(s => s.UserId == u.Id && tenantGymHouseIds.Contains(s.GymHouseId) && s.DeletedAt == null)))
            .ToListAsync(ct);
    }
}
