using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence.Repositories;

public sealed class InvitationRepository(GymManagerDbContext db) : IInvitationRepository
{
    public async Task<Invitation?> GetByTokenAsync(string token, CancellationToken ct = default) =>
        await db.Invitations
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Token == token, ct);

    /// <inheritdoc />
    public async Task<Invitation?> AcceptByTokenAsync(string token, CancellationToken ct = default)
    {
        // Single atomic UPDATE: only succeeds when the invitation is still pending.
        // Uses PostgreSQL UPDATE ... RETURNING to avoid a separate SELECT + UPDATE round-trip
        // and eliminates the TOCTOU race that exists in the read-check-update pattern.
        var now = DateTime.UtcNow;

        var rowsAffected = await db.Invitations
            .Where(i =>
                i.Token == token &&
                i.AcceptedAt == null &&
                i.ExpiresAt > now &&
                i.DeletedAt == null)
            .ExecuteUpdateAsync(
                s => s.SetProperty(i => i.AcceptedAt, now)
                       .SetProperty(i => i.UpdatedAt, now),
                ct);

        if (rowsAffected == 0)
            return null;

        // Re-fetch the now-accepted invitation (no tracking needed — caller only reads)
        return await db.Invitations
            .AsNoTracking()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(i => i.Token == token, ct);
    }

    public async Task<bool> HasPendingInviteAsync(string email, Guid tenantId, CancellationToken ct = default) =>
        await db.Invitations
            .AsNoTracking()
            .AnyAsync(i =>
                i.Email == email.ToLowerInvariant() &&
                i.TenantId == tenantId &&
                i.AcceptedAt == null &&
                i.ExpiresAt > DateTime.UtcNow, ct);

    public async Task CreateAsync(Invitation invitation, CancellationToken ct = default)
    {
        db.Invitations.Add(invitation);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Invitation invitation, CancellationToken ct = default)
    {
        var tracked = await db.Invitations
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(i => i.Id == invitation.Id, ct);

        if (tracked is not null)
        {
            db.Entry(tracked).CurrentValues.SetValues(invitation);
        }
        else
        {
            db.Invitations.Update(invitation);
        }

        await db.SaveChangesAsync(ct);
    }
}
