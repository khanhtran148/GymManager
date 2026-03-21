using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;

namespace GymManager.Tests.Common.Fakes;

public sealed class FakeInvitationRepository : IInvitationRepository
{
    private readonly List<Invitation> _store = [];

    public void Seed(params Invitation[] invitations) => _store.AddRange(invitations);

    public Task<Invitation?> GetByTokenAsync(string token, CancellationToken ct = default) =>
        Task.FromResult(_store.FirstOrDefault(i => i.Token == token && i.DeletedAt == null));

    /// <inheritdoc />
    public Task<Invitation?> AcceptByTokenAsync(string token, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var invitation = _store.FirstOrDefault(i =>
            i.Token == token &&
            i.AcceptedAt == null &&
            i.ExpiresAt > now &&
            i.DeletedAt == null);

        if (invitation is null)
            return Task.FromResult<Invitation?>(null);

        invitation.AcceptedAt = now;
        invitation.UpdatedAt = now;
        return Task.FromResult<Invitation?>(invitation);
    }

    public Task<bool> HasPendingInviteAsync(string email, Guid tenantId, CancellationToken ct = default) =>
        Task.FromResult(_store.Any(i =>
            i.Email == email.ToLowerInvariant() &&
            i.TenantId == tenantId &&
            i.DeletedAt == null &&
            i.AcceptedAt == null &&
            i.ExpiresAt > DateTime.UtcNow));

    public Task CreateAsync(Invitation invitation, CancellationToken ct = default)
    {
        _store.Add(invitation);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(Invitation invitation, CancellationToken ct = default)
    {
        var idx = _store.FindIndex(i => i.Id == invitation.Id);
        if (idx >= 0) _store[idx] = invitation;
        return Task.CompletedTask;
    }
}
