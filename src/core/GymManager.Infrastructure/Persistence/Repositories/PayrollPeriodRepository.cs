using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class PayrollPeriodRepository(GymManagerDbContext db) : IPayrollPeriodRepository
{
    public async Task CreateAsync(PayrollPeriod period, CancellationToken ct = default)
    {
        db.PayrollPeriods.Add(period);
        await db.SaveChangesAsync(ct);
    }

    public async Task<PayrollPeriod?> GetByIdAsync(Guid id, Guid gymHouseId, CancellationToken ct = default) =>
        await db.PayrollPeriods
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && p.GymHouseId == gymHouseId, ct);

    public async Task<PayrollPeriod?> GetByIdWithEntriesAsync(Guid id, Guid gymHouseId, CancellationToken ct = default) =>
        await db.PayrollPeriods
            .Include(p => p.Entries).ThenInclude(e => e.Staff).ThenInclude(s => s.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && p.GymHouseId == gymHouseId, ct);

    public async Task UpdateAsync(PayrollPeriod period, CancellationToken ct = default)
    {
        var tracked = await db.PayrollPeriods.FindAsync([period.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(period);
        }
        else
        {
            db.PayrollPeriods.Update(period);
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task<bool> HasOverlapAsync(
        Guid gymHouseId, DateOnly periodStart, DateOnly periodEnd, CancellationToken ct = default) =>
        await db.PayrollPeriods
            .AsNoTracking()
            .AnyAsync(p => p.GymHouseId == gymHouseId
                && p.PeriodStart < periodEnd
                && p.PeriodEnd > periodStart, ct);

    public async Task<PagedList<PayrollPeriod>> GetByGymHouseAsync(
        Guid gymHouseId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = db.PayrollPeriods
            .Include(p => p.Entries)
            .AsNoTracking()
            .Where(p => p.GymHouseId == gymHouseId);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(p => p.PeriodStart)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedList<PayrollPeriod>(items, totalCount, page, pageSize);
    }
}
