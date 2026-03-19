using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Application.Common.Interfaces;

public interface INotificationPreferenceRepository
{
    Task<List<NotificationPreference>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<List<NotificationPreference>> GetByUserIdsAsync(IReadOnlyList<Guid> userIds, CancellationToken ct = default);
    Task UpsertAsync(Guid userId, NotificationChannel channel, bool isEnabled, CancellationToken ct = default);
}
