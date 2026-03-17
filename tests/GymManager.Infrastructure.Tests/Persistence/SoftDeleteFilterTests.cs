using FluentAssertions;
using GymManager.Tests.Common;
using GymManager.Tests.Common.Builders;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymManager.Infrastructure.Tests.Persistence;

public sealed class SoftDeleteFilterTests : IntegrationTestBase
{
    [Fact]
    public async Task Members_SoftDeleted_NotReturnedByDefaultQuery()
    {
        var owner = new UserBuilder().WithEmail("softdelete@example.com").Build();
        DbContext.Users.Add(owner);

        var house = new GymHouseBuilder().WithOwnerId(owner.Id).Build();
        DbContext.GymHouses.Add(house);

        var memberUser = new UserBuilder()
            .WithEmail("deletedmember@example.com")
            .Build();
        DbContext.Users.Add(memberUser);

        var member = new MemberBuilder()
            .WithUserId(memberUser.Id)
            .WithGymHouseId(house.Id)
            .WithMemberCode("SD-00001")
            .Build();
        member.DeletedAt = DateTime.UtcNow;
        DbContext.Members.Add(member);

        await DbContext.SaveChangesAsync();

        // Default query should NOT return soft-deleted
        var membersDefault = await DbContext.Members
            .Where(m => m.GymHouseId == house.Id)
            .ToListAsync();

        membersDefault.Should().BeEmpty();

        // IgnoreQueryFilters should return them
        var membersAll = await DbContext.Members
            .IgnoreQueryFilters()
            .Where(m => m.GymHouseId == house.Id)
            .ToListAsync();

        membersAll.Should().HaveCount(1);
        membersAll[0].DeletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task GymHouses_SoftDeleted_NotReturnedByDefaultQuery()
    {
        var owner = new UserBuilder().WithEmail("housesoftdelete@example.com").Build();
        DbContext.Users.Add(owner);

        var house = new GymHouseBuilder().WithOwnerId(owner.Id).Build();
        house.DeletedAt = DateTime.UtcNow;
        DbContext.GymHouses.Add(house);

        await DbContext.SaveChangesAsync();

        var houses = await DbContext.GymHouses
            .Where(g => g.OwnerId == owner.Id)
            .ToListAsync();

        houses.Should().BeEmpty();

        var allHouses = await DbContext.GymHouses
            .IgnoreQueryFilters()
            .Where(g => g.OwnerId == owner.Id)
            .ToListAsync();

        allHouses.Should().HaveCount(1);
    }
}
