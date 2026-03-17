using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class UserRepository(GymManagerDbContext db) : IUserRepository
{
    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email && u.DeletedAt == null, ct);

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id && u.DeletedAt == null, ct);

    public async Task CreateAsync(User user, CancellationToken ct = default)
    {
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(User user, CancellationToken ct = default)
    {
        var tracked = await db.Users.FindAsync([user.Id], ct);
        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(user);
        }
        else
        {
            db.Users.Update(user);
        }
        await db.SaveChangesAsync(ct);
    }
}
