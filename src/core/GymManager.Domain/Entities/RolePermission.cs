using GymManager.Domain.Enums;

namespace GymManager.Domain.Entities;

public sealed class RolePermission
{
    public Guid TenantId { get; set; }
    public Role Role { get; set; }
    public Permission Permissions { get; set; }
}
