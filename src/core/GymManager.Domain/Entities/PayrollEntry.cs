using GymManager.Domain.Common;

namespace GymManager.Domain.Entities;

public sealed class PayrollEntry : AuditableEntity
{
    public Guid PayrollPeriodId { get; set; }
    public Guid StaffId { get; set; }
    public decimal BasePay { get; set; }
    public decimal ClassBonus { get; set; }
    public decimal Deductions { get; set; }
    public decimal NetPay { get; set; }
    public int ClassesTaught { get; set; }

    public PayrollPeriod PayrollPeriod { get; set; } = null!;
    public Staff Staff { get; set; } = null!;
}
