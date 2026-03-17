using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface ITimeSlotRepository
{
    Task CreateAsync(TimeSlot timeSlot, CancellationToken ct = default);
    Task<TimeSlot?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<TimeSlot?> GetByIdForUpdateAsync(Guid id, CancellationToken ct = default);
    Task UpdateAsync(TimeSlot timeSlot, CancellationToken ct = default);
    Task<List<TimeSlot>> GetByDateRangeAsync(Guid gymHouseId, DateOnly? from, DateOnly? to, CancellationToken ct = default);
    Task<bool> HasOverlapAsync(Guid gymHouseId, DateOnly date, TimeOnly startTime, TimeOnly endTime, CancellationToken ct = default);
}
