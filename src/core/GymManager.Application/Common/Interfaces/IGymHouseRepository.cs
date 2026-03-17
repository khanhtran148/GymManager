using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface IGymHouseRepository
{
    Task<GymHouse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<GymHouse>> GetByOwnerIdAsync(Guid ownerId, CancellationToken ct = default);
    Task CreateAsync(GymHouse gymHouse, CancellationToken ct = default);
    Task UpdateAsync(GymHouse gymHouse, CancellationToken ct = default);
    Task DeleteAsync(GymHouse gymHouse, CancellationToken ct = default);
}
