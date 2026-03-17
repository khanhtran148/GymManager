using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface IPayrollPeriodRepository
{
    Task CreateAsync(PayrollPeriod period, CancellationToken ct = default);
    Task<PayrollPeriod?> GetByIdAsync(Guid id, Guid gymHouseId, CancellationToken ct = default);
    Task<PayrollPeriod?> GetByIdWithEntriesAsync(Guid id, Guid gymHouseId, CancellationToken ct = default);
    Task UpdateAsync(PayrollPeriod period, CancellationToken ct = default);
    Task<bool> HasOverlapAsync(Guid gymHouseId, DateOnly periodStart, DateOnly periodEnd, CancellationToken ct = default);
    Task<PagedList<PayrollPeriod>> GetByGymHouseAsync(Guid gymHouseId, int page, int pageSize, CancellationToken ct = default);
}
