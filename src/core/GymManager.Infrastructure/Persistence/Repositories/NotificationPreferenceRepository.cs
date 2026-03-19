using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class NotificationPreferenceRepository(GymManagerDbContext db) : INotificationPreferenceRepository
{
    public async Task<List<NotificationPreference>> GetByUserIdAsync(Guid userId, CancellationToken ct = default) =>
        await db.NotificationPreferences
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .ToListAsync(ct);

    public async Task<List<NotificationPreference>> GetByUserIdsAsync(
        IReadOnlyList<Guid> userIds, CancellationToken ct = default) =>
        await db.NotificationPreferences
            .AsNoTracking()
            .Where(p => userIds.Contains(p.UserId))
            .ToListAsync(ct);

    public async Task UpsertAsync(Guid userId, NotificationChannel channel, bool isEnabled, CancellationToken ct = default)
    {
        // IgnoreQueryFilters: intentionally includes soft-deleted preferences so we can
        // restore (un-delete) a previously deleted preference rather than creating a duplicate.
        // No gym_house_id on NotificationPreference — isolation is by UserId which is user-scoped.
        var existing = await db.NotificationPreferences
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Channel == channel, ct);

        if (existing is not null)
        {
            existing.IsEnabled = isEnabled;
            existing.DeletedAt = null;
        }
        else
        {
            db.NotificationPreferences.Add(new NotificationPreference
            {
                UserId = userId,
                Channel = channel,
                IsEnabled = isEnabled
            });
        }

        await db.SaveChangesAsync(ct);
    }
}
