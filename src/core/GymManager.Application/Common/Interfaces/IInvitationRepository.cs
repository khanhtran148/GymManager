using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface IInvitationRepository
{
    Task<Invitation?> GetByTokenAsync(string token, CancellationToken ct = default);

    /// <summary>
    /// Atomically marks the invitation as accepted if it is still pending (not accepted, not expired, not deleted).
    /// Returns the updated <see cref="Invitation"/> on success, or <see langword="null"/> if no matching
    /// pending invitation exists (already accepted, expired, deleted, or token not found).
    /// </summary>
    Task<Invitation?> AcceptByTokenAsync(string token, CancellationToken ct = default);

    Task<bool> HasPendingInviteAsync(string email, Guid tenantId, CancellationToken ct = default);
    Task CreateAsync(Invitation invitation, CancellationToken ct = default);
    Task UpdateAsync(Invitation invitation, CancellationToken ct = default);
}
