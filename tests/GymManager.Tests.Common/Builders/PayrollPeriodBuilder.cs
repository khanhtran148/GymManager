using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Builders;

public sealed class PayrollPeriodBuilder
{
    private Guid _gymHouseId = Guid.NewGuid();
    private DateOnly _periodStart = new(2026, 1, 1);
    private DateOnly _periodEnd = new(2026, 1, 31);
    private PayrollStatus _status = PayrollStatus.Draft;
    private Guid? _approvedById = null;
    private DateTime? _approvedAt = null;
    private List<PayrollEntry> _entries = [];

    public PayrollPeriodBuilder WithGymHouseId(Guid id) { _gymHouseId = id; return this; }
    public PayrollPeriodBuilder WithPeriodStart(DateOnly start) { _periodStart = start; return this; }
    public PayrollPeriodBuilder WithPeriodEnd(DateOnly end) { _periodEnd = end; return this; }
    public PayrollPeriodBuilder WithStatus(PayrollStatus status) { _status = status; return this; }
    public PayrollPeriodBuilder WithApprovedById(Guid id) { _approvedById = id; return this; }
    public PayrollPeriodBuilder WithApprovedAt(DateTime at) { _approvedAt = at; return this; }
    public PayrollPeriodBuilder WithEntries(List<PayrollEntry> entries) { _entries = entries; return this; }

    public PayrollPeriod Build() => new()
    {
        GymHouseId = _gymHouseId,
        PeriodStart = _periodStart,
        PeriodEnd = _periodEnd,
        Status = _status,
        ApprovedById = _approvedById,
        ApprovedAt = _approvedAt,
        Entries = _entries
    };
}
