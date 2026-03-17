using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class TransactionRepository(GymManagerDbContext db) : ITransactionRepository
{
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
            query = query.Where(t => t.TransactionDate >= from.Value);

        if (to.HasValue)
            query = query.Where(t => t.TransactionDate <= to.Value);

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
        Guid gymHouseId, DateTime from, DateTime to, CancellationToken ct = default) =>
        await db.Transactions
            .AsNoTracking()
            .Where(t => t.GymHouseId == gymHouseId
                && t.Direction == TransactionDirection.Credit
                && t.TransactionDate >= from
                && t.TransactionDate <= to)
            .SumAsync(t => t.Amount, ct);


    public async Task<List<(TransactionDirection Direction, TransactionCategory Category, decimal Total)>> GetAggregateByDirectionAndCategoryAsync(
        Guid gymHouseId, DateTime from, DateTime to, CancellationToken ct = default)
    {
        var results = await db.Transactions
            .AsNoTracking()
            .Where(t => t.GymHouseId == gymHouseId
                && t.TransactionDate >= from
                && t.TransactionDate <= to)
            .GroupBy(t => new { t.Direction, t.Category })
            .Select(g => new { g.Key.Direction, g.Key.Category, Total = g.Sum(t => t.Amount) })
            .ToListAsync(ct);

        return [.. results.Select(r => (r.Direction, r.Category, r.Total))];
    }
}
