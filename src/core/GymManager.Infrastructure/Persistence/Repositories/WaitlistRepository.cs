using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class WaitlistRepository(GymManagerDbContext db) : IWaitlistRepository
{
    public async Task AddAsync(Waitlist waitlist, CancellationToken ct = default)
    {
        db.Waitlists.Add(waitlist);
        await db.SaveChangesAsync(ct);
    }

    public async Task<Waitlist?> GetNextInLineAsync(
        Guid? timeSlotId, Guid? classScheduleId, CancellationToken ct = default)
    {
        var query = db.Waitlists
            .AsNoTracking()
            .Where(w => w.PromotedAt == null);

        if (timeSlotId.HasValue)
            query = query.Where(w => w.TimeSlotId == timeSlotId.Value);
        else if (classScheduleId.HasValue)
            query = query.Where(w => w.ClassScheduleId == classScheduleId.Value);

        return await query
            .OrderBy(w => w.Position)
            .FirstOrDefaultAsync(ct);
    }

    public async Task RemoveAsync(Waitlist waitlist, CancellationToken ct = default)
    {
        waitlist.DeletedAt = DateTime.UtcNow;
        var tracked = await db.Waitlists.FindAsync([waitlist.Id], ct);
        if (tracked is not null)
        {
            tracked.DeletedAt = waitlist.DeletedAt;
        }
        else
        {
            db.Waitlists.Update(waitlist);
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task<Waitlist?> GetByMemberAndSlotAsync(
        Guid memberId, Guid? timeSlotId, Guid? classScheduleId, CancellationToken ct = default)
    {
        var query = db.Waitlists
            .AsNoTracking()
            .Where(w => w.MemberId == memberId && w.PromotedAt == null);

        if (timeSlotId.HasValue)
            query = query.Where(w => w.TimeSlotId == timeSlotId.Value);
        else if (classScheduleId.HasValue)
            query = query.Where(w => w.ClassScheduleId == classScheduleId.Value);

        return await query.FirstOrDefaultAsync(ct);
    }

    public async Task<int> GetNextPositionAsync(
        Guid? timeSlotId, Guid? classScheduleId, CancellationToken ct = default)
    {
        var query = db.Waitlists
            .AsNoTracking()
            .Where(w => w.PromotedAt == null);

        if (timeSlotId.HasValue)
            query = query.Where(w => w.TimeSlotId == timeSlotId.Value);
        else if (classScheduleId.HasValue)
            query = query.Where(w => w.ClassScheduleId == classScheduleId.Value);

        var maxPosition = await query.MaxAsync(w => (int?)w.Position, ct);
        return (maxPosition ?? 0) + 1;
    }

    public async Task UpdateAsync(Waitlist waitlist, CancellationToken ct = default)
    {
        var tracked = await db.Waitlists.FindAsync([waitlist.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(waitlist);
        }
        else
        {
            db.Waitlists.Update(waitlist);
        }
        await db.SaveChangesAsync(ct);
    }
}
