using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Options;
using Microsoft.Extensions.Options;
using GymManager.Infrastructure.Auth;
using GymManager.Infrastructure.Notifications;
using GymManager.Infrastructure.Payments;
using GymManager.Infrastructure.Persistence;
using GymManager.Infrastructure.Persistence.Interceptors;
using GymManager.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace GymManager.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment? environment = null)
    {
        // Register interceptor as scoped so it can access ICurrentUser (scoped service)
        services.AddScoped<TenantConnectionInterceptor>();

        services.AddDbContext<GymManagerDbContext>((serviceProvider, options) =>
        {
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(GymManagerDbContext).Assembly.FullName));
            options.AddInterceptors(serviceProvider.GetRequiredService<TenantConnectionInterceptor>());
        });

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
        services.AddScoped<IRolePermissionRepository, RolePermissionRepository>();
        services.AddScoped<IInvitationRepository, InvitationRepository>();

        // Notification Services
        services.AddScoped<IFirebaseMessagingService, FirebaseMessagingService>();
        // INotificationHub is registered in the API layer with the concrete Hub type

        // In-memory cache for role-permission lookups during token issuance
        services.AddMemoryCache();

        // Auth Services
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<IPermissionChecker, PermissionChecker>();

        // Payment Gateway — stub for development/test only; swap with real gateway in production
        if (environment is null || environment.IsDevelopment())
        {
            services.AddScoped<IPaymentGatewayService, StubPaymentGatewayService>();
        }

        // Seed Options — validated on startup
        services.AddOptions<SeedOptions>()
            .BindConfiguration(SeedOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // Invite Options
        services.AddOptions<InviteOptions>()
            .BindConfiguration(InviteOptions.SectionName);

        return services;
    }
}
