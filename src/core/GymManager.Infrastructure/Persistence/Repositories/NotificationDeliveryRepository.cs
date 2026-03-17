using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class NotificationDeliveryRepository(GymManagerDbContext db) : INotificationDeliveryRepository
{
    public async Task<NotificationDelivery?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.NotificationDeliveries
            .Include(d => d.Announcement)
            .FirstOrDefaultAsync(d => d.Id == id, ct);

    public async Task<PagedList<NotificationDelivery>> GetByRecipientAsync(
        Guid recipientId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = db.NotificationDeliveries
            .Include(d => d.Announcement)
            .AsNoTracking()
            .Where(d => d.RecipientId == recipientId)
            .OrderByDescending(d => d.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedList<NotificationDelivery>(items, totalCount, page, pageSize);
    }

    public async Task CreateBatchAsync(IEnumerable<NotificationDelivery> deliveries, CancellationToken ct = default)
    {
        db.NotificationDeliveries.AddRange(deliveries);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(NotificationDelivery delivery, CancellationToken ct = default)
    {
        var tracked = await db.NotificationDeliveries.FindAsync([delivery.Id], ct);
        if (tracked is not null)
            db.Entry(tracked).CurrentValues.SetValues(delivery);
        else
            db.NotificationDeliveries.Update(delivery);

        await db.SaveChangesAsync(ct);
    }
}
