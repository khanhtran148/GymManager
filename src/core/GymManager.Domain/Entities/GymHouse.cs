using GymManager.Domain.Common;

namespace GymManager.Domain.Entities;

public sealed class GymHouse : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? OperatingHours { get; set; }
    public int HourlyCapacity { get; set; }
    public Guid OwnerId { get; set; }
    public User Owner { get; set; } = null!;
}
