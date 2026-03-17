using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface IAnnouncementRepository
{
    Task<Announcement?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<PagedList<Announcement>> GetByHouseAsync(Guid gymHouseId, int page, int pageSize, CancellationToken ct = default);
    Task<List<Announcement>> GetDueForPublishingAsync(DateTime asOf, CancellationToken ct = default);
    Task CreateAsync(Announcement announcement, CancellationToken ct = default);
    Task UpdateAsync(Announcement announcement, CancellationToken ct = default);
}
