using FluentAssertions;
using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Infrastructure.Persistence.Repositories;
using GymManager.Infrastructure.Persistence.Seeding;
using GymManager.Tests.Common;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GymManager.Infrastructure.Tests.Persistence;

public sealed class RolePermissionRepositoryTests : IntegrationTestBase
{
    private IRolePermissionRepository Repository =>
        Services.GetRequiredService<IRolePermissionRepository>();

    protected override void ConfigureServices(IServiceCollection services)
    {
        services.AddScoped<IRolePermissionRepository, RolePermissionRepository>();
    }

    [Fact]
    public async Task GetByTenantAsync_ReturnsAllRolesForTenant()
    {
        var tenantId = Guid.NewGuid();
        var defaults = RoleSeedData.GetDefaultRolePermissions(tenantId);
        await Repository.UpsertRangeAsync(defaults);

        var result = await Repository.GetByTenantAsync(tenantId);

        result.Should().HaveCount(5);
        result.Select(r => r.Role).Should().BeEquivalentTo(
            [Role.Owner, Role.HouseManager, Role.Trainer, Role.Staff, Role.Member]);
    }

    [Fact]
    public async Task GetByTenantAndRoleAsync_ReturnsCorrectRole()
    {
        var tenantId = Guid.NewGuid();
        var rp = new RolePermission
        {
            TenantId = tenantId,
            Role = Role.Trainer,
            Permissions = Permission.ViewMembers | Permission.ViewClasses
        };
        await Repository.UpsertAsync(rp);

        var result = await Repository.GetByTenantAndRoleAsync(tenantId, Role.Trainer);

        result.Should().NotBeNull();
        result!.TenantId.Should().Be(tenantId);
        result.Role.Should().Be(Role.Trainer);
        result.Permissions.Should().HaveFlag(Permission.ViewMembers);
        result.Permissions.Should().HaveFlag(Permission.ViewClasses);
    }

    [Fact]
    public async Task GetByTenantAndRoleAsync_ReturnsNull_WhenNotFound()
    {
        var tenantId = Guid.NewGuid();

        var result = await Repository.GetByTenantAndRoleAsync(tenantId, Role.Staff);

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpsertAsync_InsertsNewRecord()
    {
        var tenantId = Guid.NewGuid();
        var rp = new RolePermission
        {
            TenantId = tenantId,
            Role = Role.Staff,
            Permissions = Permission.ViewMembers
        };

        await Repository.UpsertAsync(rp);

        var stored = await Repository.GetByTenantAndRoleAsync(tenantId, Role.Staff);
        stored.Should().NotBeNull();
        stored!.Permissions.Should().HaveFlag(Permission.ViewMembers);
    }

    [Fact]
    public async Task UpsertAsync_UpdatesExistingRecord()
    {
        var tenantId = Guid.NewGuid();
        var initial = new RolePermission
        {
            TenantId = tenantId,
            Role = Role.Trainer,
            Permissions = Permission.ViewMembers
        };
        await Repository.UpsertAsync(initial);

        var updated = new RolePermission
        {
            TenantId = tenantId,
            Role = Role.Trainer,
            Permissions = Permission.ViewMembers | Permission.ManageBookings
        };
        await Repository.UpsertAsync(updated);

        var stored = await Repository.GetByTenantAndRoleAsync(tenantId, Role.Trainer);
        stored.Should().NotBeNull();
        stored!.Permissions.Should().HaveFlag(Permission.ViewMembers);
        stored.Permissions.Should().HaveFlag(Permission.ManageBookings);
    }

    [Fact]
    public async Task UpsertRangeAsync_SeedsAllRoles()
    {
        var tenantId = Guid.NewGuid();
        var defaults = RoleSeedData.GetDefaultRolePermissions(tenantId);

        await Repository.UpsertRangeAsync(defaults);

        var result = await Repository.GetByTenantAsync(tenantId);
        result.Should().HaveCount(5);

        var ownerRow = result.Single(r => r.Role == Role.Owner);
        ownerRow.Permissions.Should().Be(Permission.Admin);

        var memberRow = result.Single(r => r.Role == Role.Member);
        memberRow.Permissions.Should().HaveFlag(Permission.ViewMembers);
        memberRow.Permissions.Should().HaveFlag(Permission.ViewSubscriptions);
    }

    [Fact]
    public async Task ExistsForTenantAsync_ReturnsFalse_WhenNoData()
    {
        var tenantId = Guid.NewGuid();

        var exists = await Repository.ExistsForTenantAsync(tenantId);

        exists.Should().BeFalse();
    }

    [Fact]
    public async Task ExistsForTenantAsync_ReturnsTrue_WhenSeeded()
    {
        var tenantId = Guid.NewGuid();
        await Repository.UpsertAsync(new RolePermission
        {
            TenantId = tenantId,
            Role = Role.Member,
            Permissions = Permission.ViewMembers
        });

        var exists = await Repository.ExistsForTenantAsync(tenantId);

        exists.Should().BeTrue();
    }
}
