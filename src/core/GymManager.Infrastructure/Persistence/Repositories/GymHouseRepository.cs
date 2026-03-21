using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class GymHouseRepository(GymManagerDbContext db) : IGymHouseRepository
{
    public async Task<GymHouse?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.GymHouses
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == id, ct);

    public async Task<List<GymHouse>> GetByOwnerIdAsync(Guid ownerId, CancellationToken ct = default) =>
        await db.GymHouses
            .AsNoTracking()
            .Where(g => g.OwnerId == ownerId)
            .OrderBy(g => g.Name)
            .ToListAsync(ct);

    public async Task<List<GymHouse>> GetAllActiveAsync(CancellationToken ct = default) =>
        await db.GymHouses
            .AsNoTracking()
            .OrderBy(g => g.Name)
            .ToListAsync(ct);

    public async Task CreateAsync(GymHouse gymHouse, CancellationToken ct = default)
    {
        db.GymHouses.Add(gymHouse);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(GymHouse gymHouse, CancellationToken ct = default)
    {
        var tracked = await db.GymHouses.FindAsync([gymHouse.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(gymHouse);
        }
        else
        {
            db.GymHouses.Update(gymHouse);
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(GymHouse gymHouse, CancellationToken ct = default)
    {
        var tracked = await db.GymHouses.FindAsync([gymHouse.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(gymHouse);
        }
        else
        {
            db.GymHouses.Update(gymHouse);
        }
        await db.SaveChangesAsync(ct);
    }
}
