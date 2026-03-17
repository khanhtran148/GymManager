using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using StaffEntity = GymManager.Domain.Entities.Staff;

namespace GymManager.Application.Common.Interfaces;

public interface IStaffRepository
{
    Task CreateAsync(StaffEntity staff, CancellationToken ct = default);
    Task<StaffEntity?> GetByIdAsync(Guid id, Guid gymHouseId, CancellationToken ct = default);
    Task UpdateAsync(StaffEntity staff, CancellationToken ct = default);
    Task<bool> ExistsAsync(Guid userId, Guid gymHouseId, CancellationToken ct = default);
    Task<PagedList<StaffEntity>> GetByGymHouseAsync(Guid gymHouseId, StaffType? staffType, int page, int pageSize, CancellationToken ct = default);
    Task<List<StaffEntity>> GetAllByGymHouseAsync(Guid gymHouseId, CancellationToken ct = default);
}
