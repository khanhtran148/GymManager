using FluentAssertions;
using GymManager.Tests.Common;
using GymManager.Tests.Common.Builders;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Testcontainers.PostgreSql;
using Xunit;

namespace GymManager.Infrastructure.Tests.Persistence;

/// <summary>
/// Tests PostgreSQL Row-Level Security policies using raw Npgsql connections.
///
/// IMPORTANT: PostgreSQL table owners and superusers bypass RLS even with FORCE.
/// To test RLS, we create a dedicated 'app_user' role that is not the table owner.
/// The application_name pattern mirrors how the real app connects.
///
/// These tests verify:
/// 1. RLS is active on member/booking/transaction tables
/// 2. A non-owner role with SET app.current_tenant_id to tenant B cannot see tenant A data
/// 3. Same role with correct tenant ID sees correct data
/// </summary>
public sealed class RlsPolicyTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("gymmanager_rls_tests")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    private string _ownerConnectionString = string.Empty;
    private string _appConnectionString = string.Empty;
    private GymManager.Infrastructure.Persistence.GymManagerDbContext _dbContext = null!;
    private IServiceProvider _sp = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        _ownerConnectionString = _postgres.GetConnectionString();

        var fakeCurrentUser = new GymManager.Tests.Common.Fakes.FakeCurrentUser
        {
            IsAuthenticated = false // Disable SET during schema creation
        };

        var services = new ServiceCollection();
        services.AddSingleton<GymManager.Application.Common.Interfaces.ICurrentUser>(fakeCurrentUser);
        services.AddScoped<GymManager.Infrastructure.Persistence.Interceptors.TenantConnectionInterceptor>();
        services.AddDbContext<GymManager.Infrastructure.Persistence.GymManagerDbContext>((sp, options) =>
        {
            options.UseNpgsql(_ownerConnectionString);
            options.AddInterceptors(sp.GetRequiredService<GymManager.Infrastructure.Persistence.Interceptors.TenantConnectionInterceptor>());
        });
        services.AddLogging();

        _sp = services.BuildServiceProvider();
        _dbContext = _sp.GetRequiredService<GymManager.Infrastructure.Persistence.GymManagerDbContext>();

        await _dbContext.Database.EnsureCreatedAsync();

        // Create a non-owner app_user role for RLS testing
        // Grant access to all tables, but this user is not the owner
        await using var adminConn = new NpgsqlConnection(_ownerConnectionString);
        await adminConn.OpenAsync();

        await using var setupCmd = adminConn.CreateCommand();
        setupCmd.CommandText = """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
                    CREATE ROLE app_user LOGIN PASSWORD 'app_pass';
                END IF;
            END $$;

            GRANT CONNECT ON DATABASE gymmanager_rls_tests TO app_user;
            GRANT USAGE ON SCHEMA public TO app_user;
            GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
            GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
            """;
        await setupCmd.ExecuteNonQueryAsync();

        // Apply RLS using FORCE so even the table owner (test) is affected when accessing as themselves,
        // but the real enforcement is on app_user who is not the owner
        var rlsSql = """
            ALTER TABLE members ENABLE ROW LEVEL SECURITY;
            ALTER TABLE members FORCE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS tenant_isolation ON members;
            CREATE POLICY tenant_isolation ON members
                USING (gym_house_id = current_setting('app.current_tenant_id', true)::uuid);

            ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
            ALTER TABLE bookings FORCE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS tenant_isolation ON bookings;
            CREATE POLICY tenant_isolation ON bookings
                USING (gym_house_id = current_setting('app.current_tenant_id', true)::uuid);

            ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
            ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS tenant_isolation ON transactions;
            CREATE POLICY tenant_isolation ON transactions
                USING (gym_house_id = current_setting('app.current_tenant_id', true)::uuid);
            """;
        await _dbContext.Database.ExecuteSqlRawAsync(rlsSql);

        // Build connection string for app_user (non-owner, subject to RLS)
        var builder = new NpgsqlConnectionStringBuilder(_ownerConnectionString)
        {
            Username = "app_user",
            Password = "app_pass"
        };
        _appConnectionString = builder.ToString();
    }

    public async Task DisposeAsync()
    {
        await _dbContext.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    private async Task<(Guid houseAId, Guid houseBId)> SeedTwoHousesAsync()
    {
        var ownerA = new UserBuilder().WithEmail($"ownerA-{Guid.NewGuid()}@rls.test").Build();
        var ownerB = new UserBuilder().WithEmail($"ownerB-{Guid.NewGuid()}@rls.test").Build();
        _dbContext.Users.AddRange(ownerA, ownerB);

        var houseA = new GymHouseBuilder().WithName("House A").WithOwnerId(ownerA.Id).Build();
        var houseB = new GymHouseBuilder().WithName("House B").WithOwnerId(ownerB.Id).Build();
        _dbContext.GymHouses.AddRange(houseA, houseB);

        await _dbContext.SaveChangesAsync();
        return (houseA.Id, houseB.Id);
    }

    private async Task<NpgsqlConnection> OpenAppConnectionWithTenantAsync(Guid tenantId)
    {
        var conn = new NpgsqlConnection(_appConnectionString);
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT set_config('{Infrastructure.Persistence.Interceptors.TenantConnectionInterceptor.PgSessionVariable}', @tenantId, false)";
        var param = cmd.CreateParameter();
        param.ParameterName = "tenantId";
        param.Value = tenantId.ToString();
        cmd.Parameters.Add(param);
        await cmd.ExecuteNonQueryAsync();
        return conn;
    }

    [Fact]
    public async Task Members_RlsPolicy_AppUserCannotSeeDifferentTenantMembers()
    {
        var (houseAId, houseBId) = await SeedTwoHousesAsync();

        var memberUser = new UserBuilder().WithEmail($"m-{Guid.NewGuid()}@rls.test").Build();
        _dbContext.Users.Add(memberUser);
        await _dbContext.SaveChangesAsync();

        // Insert member for house A using admin (owner) connection
        await using var adminConn = new NpgsqlConnection(_ownerConnectionString);
        await adminConn.OpenAsync();
        await using var insertCmd = adminConn.CreateCommand();
        insertCmd.CommandText = $"""
            INSERT INTO members (id, user_id, gym_house_id, member_code, status, joined_at, created_at, updated_at)
            VALUES (gen_random_uuid(), '{memberUser.Id}', '{houseAId}', 'RLS-001', 0, NOW(), NOW(), NOW())
        """;
        await insertCmd.ExecuteNonQueryAsync();

        // app_user queries with tenant B — should see nothing
        await using var connB = await OpenAppConnectionWithTenantAsync(houseBId);
        await using var queryCmd = connB.CreateCommand();
        queryCmd.CommandText = "SELECT COUNT(*) FROM members WHERE deleted_at IS NULL";
        var countInB = (long)(await queryCmd.ExecuteScalarAsync())!;
        countInB.Should().Be(0, "app_user with tenant B context should not see tenant A members via RLS");

        // app_user queries with tenant A — should see 1
        await using var connA = await OpenAppConnectionWithTenantAsync(houseAId);
        await using var queryCmdA = connA.CreateCommand();
        queryCmdA.CommandText = "SELECT COUNT(*) FROM members WHERE deleted_at IS NULL";
        var countInA = (long)(await queryCmdA.ExecuteScalarAsync())!;
        countInA.Should().Be(1, "app_user with tenant A context should see their own member via RLS");
    }

    [Fact]
    public async Task Bookings_RlsPolicy_AppUserCannotSeeDifferentTenantBookings()
    {
        var (houseAId, houseBId) = await SeedTwoHousesAsync();

        var memberUser = new UserBuilder().WithEmail($"bk-{Guid.NewGuid()}@rls.test").Build();
        _dbContext.Users.Add(memberUser);
        await _dbContext.SaveChangesAsync();

        await using var adminConn = new NpgsqlConnection(_ownerConnectionString);
        await adminConn.OpenAsync();

        Guid memberId;
        await using (var memberCmd = adminConn.CreateCommand())
        {
            memberCmd.CommandText = $"""
                INSERT INTO members (id, user_id, gym_house_id, member_code, status, joined_at, created_at, updated_at)
                VALUES (gen_random_uuid(), '{memberUser.Id}', '{houseAId}', 'RLS-B01', 0, NOW(), NOW(), NOW())
                RETURNING id
            """;
            memberId = (Guid)(await memberCmd.ExecuteScalarAsync())!;
        }

        await using var bookingCmd = adminConn.CreateCommand();
        bookingCmd.CommandText = $"""
            INSERT INTO bookings (id, member_id, gym_house_id, booking_type, status, booked_at, created_at, updated_at)
            VALUES (gen_random_uuid(), '{memberId}', '{houseAId}', 0, 1, NOW(), NOW(), NOW())
        """;
        await bookingCmd.ExecuteNonQueryAsync();

        // app_user with tenant B should see nothing
        await using var connB = await OpenAppConnectionWithTenantAsync(houseBId);
        await using var cmd = connB.CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM bookings WHERE deleted_at IS NULL";
        var countB = (long)(await cmd.ExecuteScalarAsync())!;
        countB.Should().Be(0, "app_user with tenant B context should not see tenant A bookings via RLS");
    }

    [Fact]
    public async Task Transactions_RlsPolicy_AppUserCannotSeeDifferentTenantTransactions()
    {
        var (houseAId, houseBId) = await SeedTwoHousesAsync();

        await using var adminConn = new NpgsqlConnection(_ownerConnectionString);
        await adminConn.OpenAsync();

        await using var insertCmd = adminConn.CreateCommand();
        insertCmd.CommandText = $"""
            INSERT INTO transactions (id, gym_house_id, transaction_type, direction, amount, category, description, transaction_date, created_at, updated_at)
            VALUES (gen_random_uuid(), '{houseAId}', 0, 0, 100.00, 0, 'RLS test', NOW(), NOW(), NOW())
        """;
        await insertCmd.ExecuteNonQueryAsync();

        // app_user with tenant B should see nothing
        await using var connB = await OpenAppConnectionWithTenantAsync(houseBId);
        await using var queryCmd = connB.CreateCommand();
        queryCmd.CommandText = "SELECT COUNT(*) FROM transactions";
        var countB = (long)(await queryCmd.ExecuteScalarAsync())!;
        countB.Should().Be(0, "app_user with tenant B context should not see tenant A transactions via RLS");

        // app_user with tenant A should see 1
        await using var connA = await OpenAppConnectionWithTenantAsync(houseAId);
        await using var queryCmdA = connA.CreateCommand();
        queryCmdA.CommandText = "SELECT COUNT(*) FROM transactions";
        var countA = (long)(await queryCmdA.ExecuteScalarAsync())!;
        countA.Should().Be(1, "app_user with tenant A context should see their own transaction via RLS");
    }
}
