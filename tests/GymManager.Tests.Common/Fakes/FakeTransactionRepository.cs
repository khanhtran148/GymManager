using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Fakes;

public sealed class FakeTransactionRepository : ITransactionRepository
{
    private readonly List<Transaction> _store = [];

    public Task RecordAsync(Transaction transaction, CancellationToken ct = default)
    {
        // Id is auto-assigned by AuditableEntity base constructor (Guid.NewGuid())
        _store.Add(transaction);
        return Task.CompletedTask;
    }

    public Task<Transaction?> GetByIdAsync(Guid id, Guid gymHouseId, CancellationToken ct = default) =>
        Task.FromResult(_store.FirstOrDefault(t => t.Id == id && t.GymHouseId == gymHouseId));

    public Task UpdateAsync(Transaction transaction, CancellationToken ct = default)
    {
        var idx = _store.FindIndex(t => t.Id == transaction.Id);
        if (idx >= 0) _store[idx] = transaction;
        return Task.CompletedTask;
    }

    public Task<PagedList<Transaction>> GetByGymHouseAsync(
        Guid gymHouseId, DateTime? from, DateTime? to,
        TransactionType? type, TransactionDirection? direction,
        int page, int pageSize, CancellationToken ct = default)
    {
        var query = _store.Where(t => t.GymHouseId == gymHouseId).AsQueryable();
        if (from.HasValue) query = query.Where(t => t.TransactionDate >= from.Value);
        if (to.HasValue) query = query.Where(t => t.TransactionDate <= to.Value);
        if (type.HasValue) query = query.Where(t => t.TransactionType == type.Value);
        if (direction.HasValue) query = query.Where(t => t.Direction == direction.Value);
        var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return Task.FromResult(new PagedList<Transaction>(items, query.Count(), page, pageSize));
    }

    public Task<decimal> GetRevenueAggregateAsync(Guid gymHouseId, DateTime from, DateTime to, CancellationToken ct = default) =>
        Task.FromResult(_store
            .Where(t => t.GymHouseId == gymHouseId && t.TransactionDate >= from && t.TransactionDate <= to && t.Direction == TransactionDirection.Credit)
            .Sum(t => t.Amount));

    public Task<bool> ExistsByRelatedEntityIdAsync(Guid relatedEntityId, TransactionType type, CancellationToken ct = default) =>
        Task.FromResult(_store.Any(t => t.RelatedEntityId == relatedEntityId && t.TransactionType == type));

    public Task<HashSet<Guid>> GetExistingRelatedEntityIdsAsync(
        IReadOnlyList<Guid> entityIds, TransactionType type, CancellationToken ct = default) =>
        Task.FromResult(
            _store
                .Where(t => t.RelatedEntityId.HasValue
                    && entityIds.Contains(t.RelatedEntityId!.Value)
                    && t.TransactionType == type)
                .Select(t => t.RelatedEntityId!.Value)
                .ToHashSet());

    public Task RecordBatchAsync(IReadOnlyList<Transaction> transactions, CancellationToken ct = default)
    {
        _store.AddRange(transactions);
        return Task.CompletedTask;
    }

    public Task<List<(TransactionDirection Direction, TransactionCategory Category, decimal Total)>> GetAggregateByDirectionAndCategoryAsync(
        Guid gymHouseId, DateTime from, DateTime to, CancellationToken ct = default) =>
        Task.FromResult(_store
            .Where(t => t.GymHouseId == gymHouseId && t.TransactionDate >= from && t.TransactionDate <= to)
            .GroupBy(t => new { t.Direction, t.Category })
            .Select(g => (g.Key.Direction, g.Key.Category, g.Sum(t => t.Amount)))
            .ToList());
}
