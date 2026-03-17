using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface IClassScheduleRepository
{
    Task CreateAsync(ClassSchedule classSchedule, CancellationToken ct = default);
    Task<ClassSchedule?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ClassSchedule?> GetByIdForUpdateAsync(Guid id, CancellationToken ct = default);
    Task UpdateAsync(ClassSchedule classSchedule, CancellationToken ct = default);
    Task<List<ClassSchedule>> GetByGymHouseIdAsync(Guid gymHouseId, DayOfWeek? dayOfWeek, CancellationToken ct = default);
    Task<bool> HasTrainerConflictAsync(Guid gymHouseId, Guid trainerId, DayOfWeek dayOfWeek, TimeOnly startTime, TimeOnly endTime, Guid? excludeId, CancellationToken ct = default);
}
