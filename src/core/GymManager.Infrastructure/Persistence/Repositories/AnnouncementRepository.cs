using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class AnnouncementRepository(GymManagerDbContext db) : IAnnouncementRepository
{
    public async Task<Announcement?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Announcements
            .Include(a => a.Author)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task<PagedList<Announcement>> GetByHouseAsync(
        Guid gymHouseId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = db.Announcements
            .Include(a => a.Author)
            .AsNoTracking()
            .Where(a => a.IsPublished &&
                        (a.GymHouseId == gymHouseId || a.GymHouseId == null))
            .OrderByDescending(a => a.PublishedAt);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedList<Announcement>(items, totalCount, page, pageSize);
    }

    public async Task<List<Announcement>> GetDueForPublishingAsync(DateTime asOf, CancellationToken ct = default) =>
        await db.Announcements
            .AsNoTracking()
            .Where(a => !a.IsPublished && a.PublishAt <= asOf)
            .ToListAsync(ct);

    public async Task CreateAsync(Announcement announcement, CancellationToken ct = default)
    {
        db.Announcements.Add(announcement);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Announcement announcement, CancellationToken ct = default)
    {
        var tracked = await db.Announcements.FindAsync([announcement.Id], ct);
        if (tracked is not null)
            db.Entry(tracked).CurrentValues.SetValues(announcement);
        else
            db.Announcements.Update(announcement);

        await db.SaveChangesAsync(ct);
    }
}
