using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Builders;

public sealed class StaffBuilder
{
    private Guid _userId = Guid.NewGuid();
    private Guid _gymHouseId = Guid.NewGuid();
    private StaffType _staffType = StaffType.Trainer;
    private decimal _baseSalary = 5000m;
    private decimal _perClassBonus = 50m;
    private DateTime _hiredAt = DateTime.UtcNow;

    public StaffBuilder WithUserId(Guid id) { _userId = id; return this; }
    public StaffBuilder WithGymHouseId(Guid id) { _gymHouseId = id; return this; }
    public StaffBuilder WithStaffType(StaffType type) { _staffType = type; return this; }
    public StaffBuilder WithBaseSalary(decimal salary) { _baseSalary = salary; return this; }
    public StaffBuilder WithPerClassBonus(decimal bonus) { _perClassBonus = bonus; return this; }
    public StaffBuilder WithHiredAt(DateTime hiredAt) { _hiredAt = hiredAt; return this; }

    public Staff Build() => new()
    {
        UserId = _userId,
        GymHouseId = _gymHouseId,
        StaffType = _staffType,
        BaseSalary = _baseSalary,
        PerClassBonus = _perClassBonus,
        HiredAt = _hiredAt
    };
}
