using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class SubscriptionRepository(GymManagerDbContext db) : ISubscriptionRepository
{
    public async Task<Subscription?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Subscriptions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<Subscription?> GetActiveByMemberIdAsync(Guid memberId, CancellationToken ct = default) =>
        await db.Subscriptions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.MemberId == memberId && s.Status == SubscriptionStatus.Active, ct);

    public async Task<List<Subscription>> GetByMemberIdAsync(Guid memberId, CancellationToken ct = default) =>
        await db.Subscriptions
            .AsNoTracking()
            .Where(s => s.MemberId == memberId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(ct);

    public async Task CreateAsync(Subscription subscription, CancellationToken ct = default)
    {
        db.Subscriptions.Add(subscription);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Subscription subscription, CancellationToken ct = default)
    {
        var tracked = await db.Subscriptions.FindAsync([subscription.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(subscription);
        }
        else
        {
            db.Subscriptions.Update(subscription);
        }
        await db.SaveChangesAsync(ct);
    }
}
