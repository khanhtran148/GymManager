using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface IInvitationRepository
{
    Task<Invitation?> GetByTokenAsync(string token, CancellationToken ct = default);
    Task<bool> HasPendingInviteAsync(string email, Guid tenantId, CancellationToken ct = default);
    Task CreateAsync(Invitation invitation, CancellationToken ct = default);
    Task UpdateAsync(Invitation invitation, CancellationToken ct = default);
}
