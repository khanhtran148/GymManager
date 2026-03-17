using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface ISubscriptionRepository
{
    Task<Subscription?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Subscription?> GetActiveByMemberIdAsync(Guid memberId, CancellationToken ct = default);
    Task<List<Subscription>> GetByMemberIdAsync(Guid memberId, CancellationToken ct = default);
    Task CreateAsync(Subscription subscription, CancellationToken ct = default);
    Task UpdateAsync(Subscription subscription, CancellationToken ct = default);
}
