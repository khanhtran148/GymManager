using FluentAssertions;
using GymManager.Tests.Common;
using GymManager.Tests.Common.Builders;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymManager.Infrastructure.Tests.Persistence;

public sealed class TransactionTenantIsolationTests : IntegrationTestBase
{
    [Fact]
    public async Task Transactions_InHouseA_NotReturnedWhenQueryingHouseB()
    {
        var ownerA = new UserBuilder().WithEmail("ownerA-finance@example.com").Build();
        var ownerB = new UserBuilder().WithEmail("ownerB-finance@example.com").Build();
        DbContext.Users.AddRange(ownerA, ownerB);

        var houseA = new GymHouseBuilder().WithName("Finance House A").WithOwnerId(ownerA.Id).Build();
        var houseB = new GymHouseBuilder().WithName("Finance House B").WithOwnerId(ownerB.Id).Build();
        DbContext.GymHouses.AddRange(houseA, houseB);
        await DbContext.SaveChangesAsync();

        var transactionA = new TransactionBuilder()
            .WithGymHouseId(houseA.Id)
            .WithAmount(500m)
            .WithDescription("House A transaction")
            .Build();

        DbContext.Transactions.Add(transactionA);
        await DbContext.SaveChangesAsync();

        // Query transactions for houseB — should be empty
        var transactionsInB = await DbContext.Transactions
            .Where(t => t.GymHouseId == houseB.Id)
            .ToListAsync();

        transactionsInB.Should().BeEmpty();

        // Query transactions for houseA — should return 1
        var transactionsInA = await DbContext.Transactions
            .Where(t => t.GymHouseId == houseA.Id)
            .ToListAsync();

        transactionsInA.Should().HaveCount(1);
        transactionsInA[0].Id.Should().Be(transactionA.Id);
        transactionsInA[0].Amount.Should().Be(500m);
    }
}
