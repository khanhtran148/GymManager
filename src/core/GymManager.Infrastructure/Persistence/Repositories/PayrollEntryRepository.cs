using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class PayrollEntryRepository(GymManagerDbContext db) : IPayrollEntryRepository
{
    public async Task<List<PayrollEntry>> GetByPeriodAsync(Guid payrollPeriodId, CancellationToken ct = default) =>
        await db.PayrollEntries
            .Include(e => e.Staff).ThenInclude(s => s.User)
            .AsNoTracking()
            .Where(e => e.PayrollPeriodId == payrollPeriodId)
            .ToListAsync(ct);
}
