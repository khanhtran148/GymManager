using GymManager.Domain.Entities;

namespace GymManager.Tests.Common.Builders;

public sealed class PayrollEntryBuilder
{
    private Guid _payrollPeriodId = Guid.NewGuid();
    private Guid _staffId = Guid.NewGuid();
    private decimal _basePay = 5000m;
    private decimal _classBonus = 0m;
    private decimal _deductions = 0m;
    private int _classesTaught = 0;

    public PayrollEntryBuilder WithPayrollPeriodId(Guid id) { _payrollPeriodId = id; return this; }
    public PayrollEntryBuilder WithStaffId(Guid id) { _staffId = id; return this; }
    public PayrollEntryBuilder WithBasePay(decimal pay) { _basePay = pay; return this; }
    public PayrollEntryBuilder WithClassBonus(decimal bonus) { _classBonus = bonus; return this; }
    public PayrollEntryBuilder WithDeductions(decimal deductions) { _deductions = deductions; return this; }
    public PayrollEntryBuilder WithClassesTaught(int count) { _classesTaught = count; return this; }

    public PayrollEntry Build() => new()
    {
        PayrollPeriodId = _payrollPeriodId,
        StaffId = _staffId,
        BasePay = _basePay,
        ClassBonus = _classBonus,
        Deductions = _deductions,
        NetPay = _basePay + _classBonus - _deductions,
        ClassesTaught = _classesTaught
    };
}
