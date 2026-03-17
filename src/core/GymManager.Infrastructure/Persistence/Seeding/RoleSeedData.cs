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
}
