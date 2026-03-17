using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface IWaitlistRepository
{
    Task AddAsync(Waitlist waitlist, CancellationToken ct = default);
    Task<Waitlist?> GetNextInLineAsync(Guid? timeSlotId, Guid? classScheduleId, CancellationToken ct = default);
    Task RemoveAsync(Waitlist waitlist, CancellationToken ct = default);
    Task<Waitlist?> GetByMemberAndSlotAsync(Guid memberId, Guid? timeSlotId, Guid? classScheduleId, CancellationToken ct = default);
    Task<int> GetNextPositionAsync(Guid? timeSlotId, Guid? classScheduleId, CancellationToken ct = default);
    Task UpdateAsync(Waitlist waitlist, CancellationToken ct = default);
}
