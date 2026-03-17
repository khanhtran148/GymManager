using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class TimeSlotRepository(GymManagerDbContext db) : ITimeSlotRepository
{
    public async Task CreateAsync(TimeSlot timeSlot, CancellationToken ct = default)
    {
        db.TimeSlots.Add(timeSlot);
        await db.SaveChangesAsync(ct);
    }

    public async Task<TimeSlot?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.TimeSlots
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task<TimeSlot?> GetByIdForUpdateAsync(Guid id, CancellationToken ct = default)
    {
        // Uses tracking (no AsNoTracking) to allow update; uses raw SQL for pessimistic lock when needed
        var timeSlot = await db.TimeSlots
            .FromSqlInterpolated($"SELECT * FROM time_slots WHERE id = {id} AND deleted_at IS NULL FOR UPDATE")
            .FirstOrDefaultAsync(ct);
        return timeSlot;
    }

    public async Task UpdateAsync(TimeSlot timeSlot, CancellationToken ct = default)
    {
        var tracked = await db.TimeSlots.FindAsync([timeSlot.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(timeSlot);
        }
        else
        {
            db.TimeSlots.Update(timeSlot);
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task<List<TimeSlot>> GetByDateRangeAsync(
        Guid gymHouseId, DateOnly? from, DateOnly? to, CancellationToken ct = default)
    {
        var query = db.TimeSlots
            .AsNoTracking()
            .Where(t => t.GymHouseId == gymHouseId);

        if (from.HasValue)
            query = query.Where(t => t.Date >= from.Value);

        if (to.HasValue)
            query = query.Where(t => t.Date <= to.Value);

        return await query
            .OrderBy(t => t.Date)
            .ThenBy(t => t.StartTime)
            .ToListAsync(ct);
    }

    public async Task<bool> HasOverlapAsync(
        Guid gymHouseId, DateOnly date, TimeOnly startTime, TimeOnly endTime, CancellationToken ct = default) =>
        await db.TimeSlots
            .AsNoTracking()
            .AnyAsync(t =>
                t.GymHouseId == gymHouseId &&
                t.Date == date &&
                t.StartTime < endTime &&
                t.EndTime > startTime, ct);
}
