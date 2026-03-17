using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Infrastructure.Persistence.Seeding;

public static class RoleSeedData
{
    public static Permission GetDefaultPermissions(Role role) => role switch
    {
        Role.Owner => Permission.Admin,
        Role.HouseManager =>
            Permission.ViewMembers | Permission.ManageMembers |
            Permission.ViewSubscriptions | Permission.ManageSubscriptions |
            Permission.ViewClasses | Permission.ManageClasses |
            Permission.ViewTrainers | Permission.ManageTrainers |
            Permission.ViewPayments | Permission.ProcessPayments |
            Permission.ManageTenant | Permission.ViewReports |
            Permission.ViewBookings | Permission.ManageBookings |
            Permission.ViewSchedule | Permission.ManageSchedule |
            Permission.ViewFinance | Permission.ViewStaff | Permission.ManageStaff |
            Permission.ViewAnnouncements | Permission.ManageAnnouncements |
            Permission.ViewShifts | Permission.ManageShifts,
        Role.Trainer =>
            Permission.ViewMembers |
            Permission.ViewSubscriptions |
            Permission.ViewClasses |
            Permission.ViewBookings | Permission.ManageBookings |
            Permission.ViewSchedule |
            Permission.ViewAnnouncements,
        Role.Staff =>
            Permission.ViewMembers | Permission.ManageMembers |
            Permission.ViewSubscriptions | Permission.ManageSubscriptions |
            Permission.ViewClasses |
            Permission.ViewPayments | Permission.ProcessPayments |
            Permission.ViewBookings | Permission.ManageBookings |
            Permission.ViewSchedule |
            Permission.ViewAnnouncements,
        Role.Member =>
            Permission.ViewMembers |
            Permission.ViewSubscriptions |
            Permission.ViewClasses |
            Permission.ViewBookings |
            Permission.ViewSchedule |
            Permission.ViewAnnouncements,
        _ => Permission.None
    };

    public static List<RolePermission> GetDefaultRolePermissions(Guid tenantId) =>
    [
        new RolePermission { TenantId = tenantId, Role = Role.Owner,        Permissions = GetDefaultPermissions(Role.Owner) },
        new RolePermission { TenantId = tenantId, Role = Role.HouseManager, Permissions = GetDefaultPermissions(Role.HouseManager) },
        new RolePermission { TenantId = tenantId, Role = Role.Trainer,      Permissions = GetDefaultPermissions(Role.Trainer) },
        new RolePermission { TenantId = tenantId, Role = Role.Staff,        Permissions = GetDefaultPermissions(Role.Staff) },
        new RolePermission { TenantId = tenantId, Role = Role.Member,       Permissions = GetDefaultPermissions(Role.Member) },
    ];
}
