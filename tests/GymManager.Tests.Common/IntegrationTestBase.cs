using GymManager.Application;
using GymManager.Application.Common.Interfaces;
using GymManager.Infrastructure.Auth;
using GymManager.Infrastructure.Notifications;
using GymManager.Infrastructure.Payments;
using GymManager.Infrastructure.Persistence;
using GymManager.Infrastructure.Persistence.Interceptors;
using GymManager.Infrastructure.Persistence.Repositories;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using Xunit;

namespace GymManager.Tests.Common;

public abstract class IntegrationTestBase : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("gymmanager_tests")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    protected IServiceProvider Services { get; private set; } = null!;
    protected GymManagerDbContext DbContext { get; private set; } = null!;

    /// <summary>
    /// Exposes the fake current user so tests can set TenantId before raw-SQL RLS tests.
    /// </summary>
    protected Fakes.FakeCurrentUser TestCurrentUser { get; } = new();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        var services = new ServiceCollection();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "test-secret-key-that-is-at-least-32-chars-long!",
                ["Jwt:Issuer"] = "gymmanager-test",
                ["Jwt:Audience"] = "gymmanager-test"
            })
            .Build();

        services.AddSingleton<IConfiguration>(config);

        // Register the fake ICurrentUser so the interceptor can resolve it
        services.AddSingleton<ICurrentUser>(TestCurrentUser);

        // Register interceptor as scoped (resolves ICurrentUser from DI)
        services.AddScoped<TenantConnectionInterceptor>();

        services.AddDbContext<GymManagerDbContext>((sp, options) =>
        {
            options.UseNpgsql(_postgres.GetConnectionString());
            options.AddInterceptors(sp.GetRequiredService<TenantConnectionInterceptor>());
        });

        // Application layer
        services.AddApplication();

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

        // Notification services
        services.AddScoped<IFirebaseMessagingService, FirebaseMessagingService>();
        services.AddScoped<INotificationHub, GymManager.Tests.Common.Fakes.FakeNotificationHub>();

        // Auth services
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
        services.AddScoped<IPermissionChecker, PermissionChecker>();

        // Payment Gateway — stub for tests
        services.AddScoped<IPaymentGatewayService, StubPaymentGatewayService>();

        // Memory cache (for JwtTokenService role-permission lookup)
        services.AddMemoryCache();

        // Logging
        services.AddLogging();

        ConfigureServices(services);

        Services = services.BuildServiceProvider();
        DbContext = Services.GetRequiredService<GymManagerDbContext>();

        await DbContext.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await DbContext.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    protected virtual void ConfigureServices(IServiceCollection services) { }
}
