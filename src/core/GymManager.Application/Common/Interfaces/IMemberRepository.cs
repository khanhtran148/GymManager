using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface IMemberRepository
{
    Task<Member?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<PagedList<Member>> GetByGymHouseIdAsync(Guid gymHouseId, int page, int pageSize, string? search, CancellationToken ct = default);
    Task<bool> ExistsByEmailAndHouseAsync(string email, Guid gymHouseId, CancellationToken ct = default);
    Task<int> GetNextSequenceAsync(Guid gymHouseId, CancellationToken ct = default);
    Task CreateAsync(Member member, CancellationToken ct = default);
    Task UpdateAsync(Member member, CancellationToken ct = default);
}
