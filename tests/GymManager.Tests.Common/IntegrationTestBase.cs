using GymManager.Application;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Options;
using GymManager.Application.Roles.Shared;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Infrastructure.Auth;
using GymManager.Infrastructure.Notifications;
using GymManager.Infrastructure.Payments;
using GymManager.Infrastructure.Persistence;
using GymManager.Infrastructure.Persistence.Interceptors;
using GymManager.Infrastructure.Persistence.Repositories;
using GymManager.Tests.Common.Builders;
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
                ["Jwt:Audience"] = "gymmanager-test",
                // InviteOptions.InviteBaseUrl is [Required] and [Url]; provide a valid test value
                ["App:InviteBaseUrl"] = "https://test.gymmanager.local/invite"
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
        services.AddScoped<IInvitationRepository, InvitationRepository>();

        // Options — InviteOptions required by CreateInvitationHandler
        // InviteBaseUrl is required and validated; supply a test value via config.
        services.AddOptions<InviteOptions>()
            .BindConfiguration(InviteOptions.SectionName)
            .ValidateDataAnnotations();

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

    /// <summary>
    /// Creates a User with Role.Owner + GymHouse + role_permissions for all roles.
    /// Sets TestCurrentUser to the created owner so subsequent handler calls run under that identity.
    /// </summary>
    protected async Task<(User Owner, GymHouse GymHouse)> CreateOwnerAsync(
        string email = "owner@test.com",
        string gymName = "Test Gym",
        CancellationToken ct = default)
    {
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Test@1234", workFactor: 4);

#pragma warning disable CS0618
        var owner = new UserBuilder()
            .WithEmail(email)
            .WithPasswordHash(passwordHash)
            .WithFullName("Test Owner")
            .WithRole(Role.Owner)
            .WithPermissions(Permission.Admin)
            .Build();
#pragma warning restore CS0618

        var gymHouse = new GymHouseBuilder()
            .WithName(gymName)
            .WithAddress("123 Test Street")
            .WithOwnerId(owner.Id)
            .Build();

        var rolePermissions = RolePermissionDefaults.GetDefaultRolePermissions(owner.Id);

        DbContext.Users.Add(owner);
        DbContext.GymHouses.Add(gymHouse);
        DbContext.RolePermissions.AddRange(rolePermissions);
        await DbContext.SaveChangesAsync(ct);

        TestCurrentUser.UserId = owner.Id;
        TestCurrentUser.TenantId = owner.Id;
        TestCurrentUser.Role = Role.Owner;
        TestCurrentUser.Permissions = Permission.Admin;
        TestCurrentUser.Email = owner.Email;

        return (owner, gymHouse);
    }

    /// <summary>
    /// Creates a User with Role.Member + Member record linked to the given gymHouseId.
    /// Returns the created User and Member without updating TestCurrentUser (caller decides).
    /// </summary>
    protected async Task<(User User, Member Member)> CreateMemberAsync(
        Guid gymHouseId,
        string email = "member@test.com",
        CancellationToken ct = default)
    {
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Test@1234", workFactor: 4);

#pragma warning disable CS0618
        var user = new UserBuilder()
            .WithEmail(email)
            .WithPasswordHash(passwordHash)
            .WithFullName("Test Member")
            .WithRole(Role.Member)
            .WithPermissions(Permission.ViewMembers)
            .Build();
#pragma warning restore CS0618

        var existingCount = await DbContext.Members
            .CountAsync(m => m.GymHouseId == gymHouseId, ct);

        var memberCode = Member.GenerateMemberCode("GM", existingCount + 1);

        var member = new MemberBuilder()
            .WithUserId(user.Id)
            .WithGymHouseId(gymHouseId)
            .WithMemberCode(memberCode)
            .Build();

        DbContext.Users.Add(user);
        DbContext.Members.Add(member);
        await DbContext.SaveChangesAsync(ct);

        return (user, member);
    }
}
