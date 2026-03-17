using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class ShiftAssignmentRepository(GymManagerDbContext db) : IShiftAssignmentRepository
{
    public async Task CreateAsync(ShiftAssignment shift, CancellationToken ct = default)
    {
        db.ShiftAssignments.Add(shift);
        await db.SaveChangesAsync(ct);
    }

    public async Task<ShiftAssignment?> GetByIdAsync(Guid id, Guid gymHouseId, CancellationToken ct = default) =>
        await db.ShiftAssignments
            .Include(sa => sa.Staff).ThenInclude(s => s.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(sa => sa.Id == id && sa.GymHouseId == gymHouseId, ct);

    public async Task UpdateAsync(ShiftAssignment shift, CancellationToken ct = default)
    {
        var tracked = await db.ShiftAssignments.FindAsync([shift.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(shift);
        }
        else
        {
            db.ShiftAssignments.Update(shift);
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task<List<ShiftAssignment>> GetByGymHouseAsync(
        Guid gymHouseId, DateOnly? from, DateOnly? to, Guid? staffId, CancellationToken ct = default)
    {
        var query = db.ShiftAssignments
            .Include(sa => sa.Staff).ThenInclude(s => s.User)
            .AsNoTracking()
            .Where(sa => sa.GymHouseId == gymHouseId);

        if (from.HasValue)
            query = query.Where(sa => sa.ShiftDate >= from.Value);

        if (to.HasValue)
            query = query.Where(sa => sa.ShiftDate <= to.Value);

        if (staffId.HasValue)
            query = query.Where(sa => sa.StaffId == staffId.Value);

        return await query
            .OrderBy(sa => sa.ShiftDate)
            .ThenBy(sa => sa.StartTime)
            .Take(500)
            .ToListAsync(ct);
    }
}
