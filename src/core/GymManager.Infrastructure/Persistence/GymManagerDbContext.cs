using Microsoft.EntityFrameworkCore;

namespace GymManager.Infrastructure.Persistence;

public sealed class GymManagerDbContext(DbContextOptions<GymManagerDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GymManagerDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
