using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class BookingRepository(GymManagerDbContext db) : IBookingRepository
{
    public async Task CreateAsync(Booking booking, CancellationToken ct = default)
    {
        db.Bookings.Add(booking);
        await db.SaveChangesAsync(ct);
    }

    public async Task<Booking?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Bookings
            .Include(b => b.Member).ThenInclude(m => m.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id, ct);

    public async Task UpdateAsync(Booking booking, CancellationToken ct = default)
    {
        var tracked = await db.Bookings.FindAsync([booking.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(booking);
        }
        else
        {
            db.Bookings.Update(booking);
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task<PagedList<Booking>> GetByMemberAsync(
        Guid memberId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = db.Bookings
            .Include(b => b.Member).ThenInclude(m => m.User)
            .AsNoTracking()
            .Where(b => b.MemberId == memberId);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(b => b.BookedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedList<Booking>(items, totalCount, page, pageSize);
    }

    public async Task<PagedList<Booking>> GetByGymHouseAsync(
        Guid gymHouseId, int page, int pageSize, DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var query = db.Bookings
            .Include(b => b.Member).ThenInclude(m => m.User)
            .AsNoTracking()
            .Where(b => b.GymHouseId == gymHouseId);

        if (from.HasValue)
            query = query.Where(b => b.BookedAt >= from.Value);

        if (to.HasValue)
            query = query.Where(b => b.BookedAt <= to.Value);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(b => b.BookedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedList<Booking>(items, totalCount, page, pageSize);
    }

    public async Task<int> CountCompletedByTrainerAsync(
        Guid trainerId, Guid gymHouseId, DateTime from, DateTime to, CancellationToken ct = default) =>
        await db.Bookings
            .AsNoTracking()
            .Include(b => b.ClassSchedule)
            .CountAsync(b =>
                b.GymHouseId == gymHouseId
                && b.Status == BookingStatus.Completed
                && b.ClassSchedule != null
                && b.ClassSchedule.TrainerId == trainerId
                && b.BookedAt >= from
                && b.BookedAt <= to, ct);
}
