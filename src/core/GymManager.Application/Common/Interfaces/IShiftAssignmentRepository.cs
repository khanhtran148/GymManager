using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface IShiftAssignmentRepository
{
    Task CreateAsync(ShiftAssignment shift, CancellationToken ct = default);
    Task<ShiftAssignment?> GetByIdAsync(Guid id, Guid gymHouseId, CancellationToken ct = default);
    Task UpdateAsync(ShiftAssignment shift, CancellationToken ct = default);
    Task<List<ShiftAssignment>> GetByGymHouseAsync(Guid gymHouseId, DateOnly? from, DateOnly? to, Guid? staffId, CancellationToken ct = default);
}
