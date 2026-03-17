using GymManager.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
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

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        var services = new ServiceCollection();

        services.AddDbContext<GymManagerDbContext>(options =>
            options.UseNpgsql(_postgres.GetConnectionString()));

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
