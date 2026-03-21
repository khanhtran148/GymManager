using FluentAssertions;
using GymManager.Domain.Enums;
using GymManager.Tests.Common;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymManager.Application.Tests.TestInfrastructure;

public sealed class TestHelperSmokeTests : IntegrationTestBase
{
    [Fact]
    public async Task CreateOwnerAsync_CreatesOwnerWithGymHouseAndRolePermissions()
    {
        var (owner, gymHouse) = await CreateOwnerAsync("owner@smoketest.com", "Smoke Test Gym");

        var storedOwner = await DbContext.Users.FindAsync(owner.Id);
        storedOwner.Should().NotBeNull();
        storedOwner!.Role.Should().Be(Role.Owner);
        storedOwner.Email.Should().Be("owner@smoketest.com");

        var storedGymHouse = await DbContext.GymHouses.FindAsync(gymHouse.Id);
        storedGymHouse.Should().NotBeNull();
        storedGymHouse!.OwnerId.Should().Be(owner.Id);
        storedGymHouse.Name.Should().Be("Smoke Test Gym");

        var rolePermissions = await DbContext.RolePermissions
            .Where(rp => rp.TenantId == owner.Id)
            .ToListAsync();
        rolePermissions.Should().HaveCount(5);
        rolePermissions.Select(rp => rp.Role).Should().BeEquivalentTo(
            [Role.Owner, Role.HouseManager, Role.Trainer, Role.Staff, Role.Member]);

        TestCurrentUser.UserId.Should().Be(owner.Id);
        TestCurrentUser.TenantId.Should().Be(owner.Id);
        TestCurrentUser.Role.Should().Be(Role.Owner);
    }

    [Fact]
    public async Task CreateMemberAsync_CreatesMemberLinkedToGymHouse()
    {
        var (owner, gymHouse) = await CreateOwnerAsync("owner2@smoketest.com", "Gym For Members");

        var (user, member) = await CreateMemberAsync(gymHouse.Id, "member@smoketest.com");

        var storedUser = await DbContext.Users.FindAsync(user.Id);
        storedUser.Should().NotBeNull();
        storedUser!.Role.Should().Be(Role.Member);
        storedUser.Email.Should().Be("member@smoketest.com");

        var storedMember = await DbContext.Members.FindAsync(member.Id);
        storedMember.Should().NotBeNull();
        storedMember!.UserId.Should().Be(user.Id);
        storedMember.GymHouseId.Should().Be(gymHouse.Id);
        storedMember.MemberCode.Should().NotBeNullOrEmpty();
    }
}
