using FluentAssertions;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Tests.Common;
using GymManager.Tests.Common.Builders;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymManager.Infrastructure.Tests.Persistence;

public sealed class TenantIsolationTests : IntegrationTestBase
{
    [Fact]
    public async Task Members_InHouseA_NotReturnedWhenQueryingHouseB()
    {
        var ownerA = new UserBuilder().WithEmail("ownerA@example.com").Build();
        var ownerB = new UserBuilder().WithEmail("ownerB@example.com").Build();
        DbContext.Users.AddRange(ownerA, ownerB);

        var houseA = new GymHouseBuilder().WithName("House A").WithOwnerId(ownerA.Id).Build();
        var houseB = new GymHouseBuilder().WithName("House B").WithOwnerId(ownerB.Id).Build();
        DbContext.GymHouses.AddRange(houseA, houseB);

        var userA = new UserBuilder()
            .WithEmail("memberA@example.com")
            .WithRole(Role.Member)
            .WithPermissions(Permission.ViewMembers)
            .Build();
        DbContext.Users.Add(userA);

        var memberA = new MemberBuilder()
            .WithUserId(userA.Id)
            .WithGymHouseId(houseA.Id)
            .WithMemberCode("HA-00001")
            .Build();
        DbContext.Members.Add(memberA);

        await DbContext.SaveChangesAsync();

        // Query members for houseB — should be empty
        var membersInB = await DbContext.Members
            .Where(m => m.GymHouseId == houseB.Id)
            .ToListAsync();

        membersInB.Should().BeEmpty();

        // Query members for houseA — should return 1
        var membersInA = await DbContext.Members
            .Where(m => m.GymHouseId == houseA.Id)
            .ToListAsync();

        membersInA.Should().HaveCount(1);
        membersInA[0].Id.Should().Be(memberA.Id);
    }
}
