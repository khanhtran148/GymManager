using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Entities;

public sealed class PayrollPeriod : AuditableEntity
{
    public Guid GymHouseId { get; set; }
    public DateOnly PeriodStart { get; set; }
    public DateOnly PeriodEnd { get; set; }
    public PayrollStatus Status { get; set; } = PayrollStatus.Draft;
    public Guid? ApprovedById { get; set; }
    public DateTime? ApprovedAt { get; set; }

    public GymHouse GymHouse { get; set; } = null!;
    public List<PayrollEntry> Entries { get; set; } = [];
}
