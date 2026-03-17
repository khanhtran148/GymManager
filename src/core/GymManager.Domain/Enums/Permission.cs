namespace GymManager.Domain.Enums;

[Flags]
public enum Permission : long
{
    None = 0,

    // Members
    ViewMembers = 1L << 0,
    ManageMembers = 1L << 1,

    // Subscriptions
    ViewSubscriptions = 1L << 2,
    ManageSubscriptions = 1L << 3,

    // Classes
    ViewClasses = 1L << 4,
    ManageClasses = 1L << 5,

    // Trainers
    ViewTrainers = 1L << 6,
    ManageTrainers = 1L << 7,

    // Payments
    ViewPayments = 1L << 8,
    ProcessPayments = 1L << 9,

    // Tenants / Settings
    ManageTenant = 1L << 10,

    // Reports
    ViewReports = 1L << 11,

    // Bookings
    ManageBookings = 1L << 12,
    ViewBookings = 1L << 13,

    // Schedule
    ManageSchedule = 1L << 14,
    ViewSchedule = 1L << 15,

    // Finance
    ManageFinance = 1L << 16,
    ViewFinance = 1L << 17,

    // Staff
    ManageStaff = 1L << 18,
    ViewStaff = 1L << 19,

    // Announcements
    ManageAnnouncements = 1L << 20,
    ViewAnnouncements = 1L << 21,

    // Payroll
    ApprovePayroll = 1L << 22,

    // Shifts
    ManageShifts = 1L << 23,
    ViewShifts = 1L << 24,

    // Waitlist
    ManageWaitlist = 1L << 25,

    // Admin
    Admin = ~0L
}
