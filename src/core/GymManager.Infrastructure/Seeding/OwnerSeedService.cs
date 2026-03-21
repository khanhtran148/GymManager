using GymManager.Application.Common.Options;
using GymManager.Application.Roles.Shared;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace GymManager.Infrastructure.Seeding;

public sealed class OwnerSeedService(
    IServiceScopeFactory scopeFactory,
    IOptions<SeedOptions> seedOptions,
    ILogger<OwnerSeedService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var options = seedOptions.Value;

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<GymManagerDbContext>();

        var ownerExists = await db.Users
            .AnyAsync(u => u.Role == Role.Owner && u.DeletedAt == null, cancellationToken);

        if (ownerExists)
        {
            logger.LogInformation("Owner seed skipped — an owner account already exists.");
            return;
        }

        logger.LogInformation("No owner found — seeding initial owner account for {Email}.", options.Email);

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(options.Password, workFactor: 12);

#pragma warning disable CS0618
        var owner = new User
        {
            Email = options.Email.ToLowerInvariant(),
            PasswordHash = passwordHash,
            FullName = "Gym Owner",
            Role = Role.Owner,
            Permissions = Permission.Admin
        };
#pragma warning restore CS0618

        var gymHouse = new GymHouse
        {
            Name = options.GymName,
            Address = "To be updated",
            OwnerId = owner.Id,
            HourlyCapacity = 50
        };

        var rolePermissions = RolePermissionDefaults.GetDefaultRolePermissions(owner.Id);

        db.Users.Add(owner);
        db.GymHouses.Add(gymHouse);
        db.RolePermissions.AddRange(rolePermissions);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
            logger.LogInformation(
                "Owner seed complete — UserId={OwnerId}, GymHouseId={GymHouseId}.",
                owner.Id, gymHouse.Id);
        }
        catch (DbUpdateException ex)
        {
            // Another pod won the race — this is acceptable; log and continue.
            logger.LogWarning(ex,
                "Owner seed skipped due to concurrent startup — another instance already created the owner.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
