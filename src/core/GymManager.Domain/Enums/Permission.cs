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

    // Admin
    Admin = ~0L
}
