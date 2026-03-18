using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class TransactionRepository(GymManagerDbContext db) : ITransactionRepository
{
    private static DateTime ToUtc(DateTime dt) =>
        dt.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(dt, DateTimeKind.Utc) : dt.ToUniversalTime();

    public async Task RecordAsync(Transaction transaction, CancellationToken ct = default)
    {
        db.Transactions.Add(transaction);
        await db.SaveChangesAsync(ct);
    }

    public async Task<Transaction?> GetByIdAsync(Guid id, Guid gymHouseId, CancellationToken ct = default) =>
        await db.Transactions
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id && t.GymHouseId == gymHouseId, ct);

    public async Task UpdateAsync(Transaction transaction, CancellationToken ct = default)
    {
        var tracked = await db.Transactions.FindAsync([transaction.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(transaction);
        }
        else
        {
            db.Transactions.Update(transaction);
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task<PagedList<Transaction>> GetByGymHouseAsync(
        Guid gymHouseId,
        DateTime? from,
        DateTime? to,
        TransactionType? type,
        TransactionDirection? direction,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var query = db.Transactions
            .AsNoTracking()
            .Where(t => t.GymHouseId == gymHouseId);

        if (from.HasValue)
        {
            var fromUtc = ToUtc(from.Value);
            query = query.Where(t => t.TransactionDate >= fromUtc);
        }

        if (to.HasValue)
        {
            var toUtc = ToUtc(to.Value);
            query = query.Where(t => t.TransactionDate <= toUtc);
        }

        if (type.HasValue)
            query = query.Where(t => t.TransactionType == type.Value);

        if (direction.HasValue)
            query = query.Where(t => t.Direction == direction.Value);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedList<Transaction>(items, totalCount, page, pageSize);
    }

    public async Task<bool> ExistsByRelatedEntityIdAsync(Guid relatedEntityId, TransactionType type, CancellationToken ct = default) =>
        await db.Transactions
            .AsNoTracking()
            .AnyAsync(t => t.RelatedEntityId == relatedEntityId && t.TransactionType == type, ct);

    public async Task<decimal> GetRevenueAggregateAsync(
        Guid gymHouseId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        var fromUtc = ToUtc(from);
        var toUtc = ToUtc(to);
        return await db.Transactions
            .AsNoTracking()
            .Where(t => t.GymHouseId == gymHouseId
                && t.Direction == TransactionDirection.Credit
                && t.TransactionDate >= fromUtc
                && t.TransactionDate <= toUtc)
            .SumAsync(t => t.Amount, ct);
    }


    public async Task<List<(TransactionDirection Direction, TransactionCategory Category, decimal Total)>> GetAggregateByDirectionAndCategoryAsync(
        Guid gymHouseId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        var fromUtc = ToUtc(from);
        var toUtc = ToUtc(to);
        var results = await db.Transactions
            .AsNoTracking()
            .Where(t => t.GymHouseId == gymHouseId
                && t.TransactionDate >= fromUtc
                && t.TransactionDate <= toUtc)
            .GroupBy(t => new { t.Direction, t.Category })
            .Select(g => new { g.Key.Direction, g.Key.Category, Total = g.Sum(t => t.Amount) })
            .ToListAsync(ct);

        return [.. results.Select(r => (r.Direction, r.Category, r.Total))];
    }
}
