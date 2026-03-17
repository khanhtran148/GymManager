using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface IBookingRepository
{
    Task CreateAsync(Booking booking, CancellationToken ct = default);
    Task<Booking?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task UpdateAsync(Booking booking, CancellationToken ct = default);
    Task<PagedList<Booking>> GetByMemberAsync(Guid memberId, int page, int pageSize, CancellationToken ct = default);
    Task<PagedList<Booking>> GetByGymHouseAsync(Guid gymHouseId, int page, int pageSize, DateTime? from, DateTime? to, CancellationToken ct = default);
}
