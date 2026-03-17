using GymManager.Application.Common.Interfaces;
using GymManager.Infrastructure.Auth;
using GymManager.Infrastructure.Notifications;
using GymManager.Infrastructure.Persistence;
using GymManager.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GymManager.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<GymManagerDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(GymManagerDbContext).Assembly.FullName)));

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IGymHouseRepository, GymHouseRepository>();
        services.AddScoped<IMemberRepository, MemberRepository>();
        services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
        services.AddScoped<ITimeSlotRepository, TimeSlotRepository>();
        services.AddScoped<IClassScheduleRepository, ClassScheduleRepository>();
        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<IWaitlistRepository, WaitlistRepository>();
        services.AddScoped<ITransactionRepository, TransactionRepository>();
        services.AddScoped<IStaffRepository, StaffRepository>();
        services.AddScoped<IShiftAssignmentRepository, ShiftAssignmentRepository>();
        services.AddScoped<IPayrollPeriodRepository, PayrollPeriodRepository>();
        services.AddScoped<IPayrollEntryRepository, PayrollEntryRepository>();
        services.AddScoped<IAnnouncementRepository, AnnouncementRepository>();
        services.AddScoped<INotificationDeliveryRepository, NotificationDeliveryRepository>();
        services.AddScoped<INotificationPreferenceRepository, NotificationPreferenceRepository>();

        // Notification Services
        services.AddScoped<IFirebaseMessagingService, FirebaseMessagingService>();
        services.AddScoped<INotificationHub, SignalRNotificationHub>();

        // Auth Services
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<IPermissionChecker, PermissionChecker>();

        return services;
    }
}
