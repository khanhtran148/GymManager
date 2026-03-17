using GymManager.Domain.Entities;

namespace GymManager.Application.Common.Interfaces;

public interface IPayrollEntryRepository
{
    Task<List<PayrollEntry>> GetByPeriodAsync(Guid payrollPeriodId, CancellationToken ct = default);
}
