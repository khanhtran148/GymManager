using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Application.Common.Interfaces;

public interface ITransactionRepository
{
    Task RecordAsync(Transaction transaction, CancellationToken ct = default);
    Task<Transaction?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task UpdateAsync(Transaction transaction, CancellationToken ct = default);
    Task<PagedList<Transaction>> GetByGymHouseAsync(
        Guid gymHouseId,
        DateTime? from,
        DateTime? to,
        TransactionType? type,
        TransactionDirection? direction,
        int page,
        int pageSize,
        CancellationToken ct = default);
    Task<decimal> GetRevenueAggregateAsync(Guid gymHouseId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<decimal> GetExpenseAggregateAsync(Guid gymHouseId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<List<(TransactionDirection Direction, TransactionCategory Category, decimal Total)>> GetAggregateByDirectionAndCategoryAsync(
        Guid gymHouseId, DateTime from, DateTime to, CancellationToken ct = default);
}
