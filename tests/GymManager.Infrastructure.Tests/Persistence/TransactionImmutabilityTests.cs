using FluentAssertions;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Tests.Common;
using GymManager.Tests.Common.Builders;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymManager.Infrastructure.Tests.Persistence;

public sealed class TransactionImmutabilityTests : IntegrationTestBase
{
    [Fact]
    public async Task Transaction_WithDeletedAtSet_StillVisibleInQuery()
    {
        var owner = new UserBuilder().WithEmail("owner-immutability@example.com").Build();
        DbContext.Users.Add(owner);

        var house = new GymHouseBuilder().WithOwnerId(owner.Id).Build();
        DbContext.GymHouses.Add(house);
        await DbContext.SaveChangesAsync();

        var transaction = new TransactionBuilder()
            .WithGymHouseId(house.Id)
            .WithAmount(100m)
            .Build();

        DbContext.Transactions.Add(transaction);
        await DbContext.SaveChangesAsync();

        // Simulate setting DeletedAt (which should NEVER happen in app code, but we verify the query filter is not applied)
        transaction.DeletedAt = DateTime.UtcNow;
        await DbContext.SaveChangesAsync();

        // Transaction must still be visible — no query filter on DeletedAt
        var found = await DbContext.Transactions
            .FirstOrDefaultAsync(t => t.Id == transaction.Id);

        found.Should().NotBeNull();
        found!.DeletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Transactions_NoSoftDeleteFilter_AllTransactionsVisible()
    {
        var owner = new UserBuilder().WithEmail("owner-nodeletfilter@example.com").Build();
        DbContext.Users.Add(owner);

        var house = new GymHouseBuilder().WithOwnerId(owner.Id).Build();
        DbContext.GymHouses.Add(house);
        await DbContext.SaveChangesAsync();

        var t1 = new TransactionBuilder().WithGymHouseId(house.Id).WithAmount(100m).Build();
        var t2 = new TransactionBuilder().WithGymHouseId(house.Id).WithAmount(200m).Build();

        DbContext.Transactions.AddRange(t1, t2);
        await DbContext.SaveChangesAsync();

        // Even if we fake a soft-delete on t1
        t1.DeletedAt = DateTime.UtcNow;
        await DbContext.SaveChangesAsync();

        var count = await DbContext.Transactions
            .CountAsync(t => t.GymHouseId == house.Id);

        count.Should().Be(2);
    }
}
