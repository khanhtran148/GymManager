using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class StaffRepository(GymManagerDbContext db) : IStaffRepository
{
    public async Task CreateAsync(Staff staff, CancellationToken ct = default)
    {
        db.Staff.Add(staff);
        await db.SaveChangesAsync(ct);
    }

    public async Task<Staff?> GetByIdAsync(Guid id, Guid gymHouseId, CancellationToken ct = default) =>
        await db.Staff
            .Include(s => s.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id && s.GymHouseId == gymHouseId, ct);

    public async Task UpdateAsync(Staff staff, CancellationToken ct = default)
    {
        var tracked = await db.Staff.FindAsync([staff.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(staff);
        }
        else
        {
            db.Staff.Update(staff);
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task<bool> ExistsAsync(Guid userId, Guid gymHouseId, CancellationToken ct = default) =>
        await db.Staff
            .AsNoTracking()
            .AnyAsync(s => s.UserId == userId && s.GymHouseId == gymHouseId, ct);

    public async Task<PagedList<Staff>> GetByGymHouseAsync(
        Guid gymHouseId, StaffType? staffType, int page, int pageSize, CancellationToken ct = default)
    {
        var query = db.Staff
            .Include(s => s.User)
            .AsNoTracking()
            .Where(s => s.GymHouseId == gymHouseId);

        if (staffType.HasValue)
            query = query.Where(s => s.StaffType == staffType.Value);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(s => s.HiredAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedList<Staff>(items, totalCount, page, pageSize);
    }

    public async Task<List<Staff>> GetAllByGymHouseAsync(Guid gymHouseId, CancellationToken ct = default) =>
        await db.Staff
            .Include(s => s.User)
            .AsNoTracking()
            .Where(s => s.GymHouseId == gymHouseId)
            .ToListAsync(ct);
}
