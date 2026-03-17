using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class MemberRepository(GymManagerDbContext db) : IMemberRepository
{
    public async Task<Member?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Members
            .Include(m => m.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id, ct);

    public async Task<PagedList<Member>> GetByGymHouseIdAsync(
        Guid gymHouseId, int page, int pageSize, string? search, CancellationToken ct = default)
    {
        var query = db.Members
            .Include(m => m.User)
            .AsNoTracking()
            .Where(m => m.GymHouseId == gymHouseId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLowerInvariant();
            query = query.Where(m =>
                m.MemberCode.ToLower().Contains(lower) ||
                m.User.FullName.ToLower().Contains(lower) ||
                m.User.Email.ToLower().Contains(lower));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderBy(m => m.MemberCode)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedList<Member>(items, totalCount, page, pageSize);
    }

    public async Task<bool> ExistsByEmailAndHouseAsync(string email, Guid gymHouseId, CancellationToken ct = default) =>
        await db.Members
            .AsNoTracking()
            .AnyAsync(m => m.GymHouseId == gymHouseId && m.User.Email == email.ToLowerInvariant(), ct);

    public async Task<int> GetNextSequenceAsync(Guid gymHouseId, CancellationToken ct = default)
    {
        var count = await db.Members
            .IgnoreQueryFilters()
            .CountAsync(m => m.GymHouseId == gymHouseId, ct);
        return count + 1;
    }

    public async Task CreateAsync(Member member, CancellationToken ct = default)
    {
        db.Members.Add(member);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Member member, CancellationToken ct = default)
    {
        var tracked = await db.Members.FindAsync([member.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(member);
        }
        else
        {
            db.Members.Update(member);
        }
        await db.SaveChangesAsync(ct);
    }
}
