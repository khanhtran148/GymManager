using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Entities;

public sealed class Staff : AuditableEntity
{
    public Guid UserId { get; set; }
    public Guid GymHouseId { get; set; }
    public StaffType StaffType { get; set; }
    public decimal BaseSalary { get; set; }
    public decimal PerClassBonus { get; set; }
    public DateTime HiredAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public GymHouse GymHouse { get; set; } = null!;
    public List<ShiftAssignment> ShiftAssignments { get; set; } = [];
}
