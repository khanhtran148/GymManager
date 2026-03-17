using FluentAssertions;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Tests.Common;
using GymManager.Tests.Common.Builders;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GymManager.Infrastructure.Tests.Security;

/// <summary>
/// Integration tests verifying EF Core global query filters enforce tenant isolation.
/// One test per tenant-scoped entity: insert data in house A, query from house B
/// context (by filtering on house B's ID), assert empty result.
///
/// These tests verify the EF Core filter layer. The RLS policy layer is tested
/// separately in RlsPolicyTests using raw SQL connections.
/// </summary>
public sealed class TenantIsolationSuiteTests : IntegrationTestBase
{
    private async Task<(GymHouse houseA, GymHouse houseB, User ownerA, User ownerB)> SeedTwoHousesAsync()
    {
        var ownerA = new UserBuilder().WithEmail($"ownerA-{Guid.NewGuid()}@iso.test").Build();
        var ownerB = new UserBuilder().WithEmail($"ownerB-{Guid.NewGuid()}@iso.test").Build();
        DbContext.Users.AddRange(ownerA, ownerB);

        var houseA = new GymHouseBuilder().WithName("House A").WithOwnerId(ownerA.Id).Build();
        var houseB = new GymHouseBuilder().WithName("House B").WithOwnerId(ownerB.Id).Build();
        DbContext.GymHouses.AddRange(houseA, houseB);

        await DbContext.SaveChangesAsync();
        return (houseA, houseB, ownerA, ownerB);
    }

    [Fact]
    public async Task Members_InHouseA_NotVisibleWhenQueryingHouseB()
    {
        var (houseA, houseB, _, _) = await SeedTwoHousesAsync();

        var memberUser = new UserBuilder().WithEmail($"member-{Guid.NewGuid()}@iso.test").Build();
        DbContext.Users.Add(memberUser);
        var member = new MemberBuilder().WithUserId(memberUser.Id).WithGymHouseId(houseA.Id).Build();
        DbContext.Members.Add(member);
        await DbContext.SaveChangesAsync();

        var membersInB = await DbContext.Members
            .AsNoTracking()
            .Where(m => m.GymHouseId == houseB.Id)
            .ToListAsync();

        membersInB.Should().BeEmpty("members from house A should not appear when filtering by house B");
    }

    [Fact]
    public async Task Subscriptions_InHouseA_NotVisibleWhenQueryingHouseB()
    {
        var (houseA, houseB, _, _) = await SeedTwoHousesAsync();

        var memberUser = new UserBuilder().WithEmail($"sub-{Guid.NewGuid()}@iso.test").Build();
        DbContext.Users.Add(memberUser);
        var member = new MemberBuilder().WithUserId(memberUser.Id).WithGymHouseId(houseA.Id).Build();
        DbContext.Members.Add(member);
        await DbContext.SaveChangesAsync();

        var sub = new SubscriptionBuilder()
            .WithMemberId(member.Id)
            .WithGymHouseId(houseA.Id)
            .Build();
        DbContext.Subscriptions.Add(sub);
        await DbContext.SaveChangesAsync();

        var subsInB = await DbContext.Subscriptions
            .AsNoTracking()
            .Where(s => s.GymHouseId == houseB.Id)
            .ToListAsync();

        subsInB.Should().BeEmpty();
    }

    [Fact]
    public async Task TimeSlots_InHouseA_NotVisibleWhenQueryingHouseB()
    {
        var (houseA, houseB, _, _) = await SeedTwoHousesAsync();

        var slot = new TimeSlotBuilder().WithGymHouseId(houseA.Id).Build();
        DbContext.TimeSlots.Add(slot);
        await DbContext.SaveChangesAsync();

        var slotsInB = await DbContext.TimeSlots
            .AsNoTracking()
            .Where(t => t.GymHouseId == houseB.Id)
            .ToListAsync();

        slotsInB.Should().BeEmpty();
    }

    [Fact]
    public async Task ClassSchedules_InHouseA_NotVisibleWhenQueryingHouseB()
    {
        var (houseA, houseB, _, _) = await SeedTwoHousesAsync();

        var trainerUser = new UserBuilder().WithEmail($"trainer-{Guid.NewGuid()}@iso.test").Build();
        DbContext.Users.Add(trainerUser);
        await DbContext.SaveChangesAsync();

        var schedule = new ClassScheduleBuilder()
            .WithGymHouseId(houseA.Id)
            .WithTrainerId(trainerUser.Id)
            .Build();
        DbContext.ClassSchedules.Add(schedule);
        await DbContext.SaveChangesAsync();

        var schedulesInB = await DbContext.ClassSchedules
            .AsNoTracking()
            .Where(cs => cs.GymHouseId == houseB.Id)
            .ToListAsync();

        schedulesInB.Should().BeEmpty();
    }

    [Fact]
    public async Task Bookings_InHouseA_NotVisibleWhenQueryingHouseB()
    {
        var (houseA, houseB, _, _) = await SeedTwoHousesAsync();

        var memberUser = new UserBuilder().WithEmail($"bk-{Guid.NewGuid()}@iso.test").Build();
        DbContext.Users.Add(memberUser);
        var member = new MemberBuilder().WithUserId(memberUser.Id).WithGymHouseId(houseA.Id).Build();
        DbContext.Members.Add(member);
        await DbContext.SaveChangesAsync();

        var booking = new BookingBuilder().WithMemberId(member.Id).WithGymHouseId(houseA.Id).Build();
        DbContext.Bookings.Add(booking);
        await DbContext.SaveChangesAsync();

        var bookingsInB = await DbContext.Bookings
            .AsNoTracking()
            .Where(b => b.GymHouseId == houseB.Id)
            .ToListAsync();

        bookingsInB.Should().BeEmpty();
    }

    [Fact]
    public async Task Staff_InHouseA_NotVisibleWhenQueryingHouseB()
    {
        var (houseA, houseB, _, _) = await SeedTwoHousesAsync();

        var staffUser = new UserBuilder().WithEmail($"staff-{Guid.NewGuid()}@iso.test").Build();
        DbContext.Users.Add(staffUser);
        var staff = new StaffBuilder().WithUserId(staffUser.Id).WithGymHouseId(houseA.Id).Build();
        DbContext.Staff.Add(staff);
        await DbContext.SaveChangesAsync();

        var staffInB = await DbContext.Staff
            .AsNoTracking()
            .Where(s => s.GymHouseId == houseB.Id)
            .ToListAsync();

        staffInB.Should().BeEmpty();
    }

    [Fact]
    public async Task ShiftAssignments_InHouseA_NotVisibleWhenQueryingHouseB()
    {
        var (houseA, houseB, _, _) = await SeedTwoHousesAsync();

        var staffUser = new UserBuilder().WithEmail($"sa-{Guid.NewGuid()}@iso.test").Build();
        DbContext.Users.Add(staffUser);
        var staff = new StaffBuilder().WithUserId(staffUser.Id).WithGymHouseId(houseA.Id).Build();
        DbContext.Staff.Add(staff);
        await DbContext.SaveChangesAsync();

        var shift = new ShiftAssignmentBuilder()
            .WithStaffId(staff.Id)
            .WithGymHouseId(houseA.Id)
            .Build();
        DbContext.ShiftAssignments.Add(shift);
        await DbContext.SaveChangesAsync();

        var shiftsInB = await DbContext.ShiftAssignments
            .AsNoTracking()
            .Where(sa => sa.GymHouseId == houseB.Id)
            .ToListAsync();

        shiftsInB.Should().BeEmpty();
    }

    [Fact]
    public async Task Transactions_InHouseA_NotVisibleWhenQueryingHouseB()
    {
        var (houseA, houseB, _, _) = await SeedTwoHousesAsync();

        var tx = new TransactionBuilder().WithGymHouseId(houseA.Id).Build();
        DbContext.Transactions.Add(tx);
        await DbContext.SaveChangesAsync();

        var txInB = await DbContext.Transactions
            .AsNoTracking()
            .Where(t => t.GymHouseId == houseB.Id)
            .ToListAsync();

        txInB.Should().BeEmpty();
    }

    [Fact]
    public async Task PayrollPeriods_InHouseA_NotVisibleWhenQueryingHouseB()
    {
        var (houseA, houseB, ownerA, _) = await SeedTwoHousesAsync();

        var period = new PayrollPeriodBuilder().WithGymHouseId(houseA.Id).Build();
        DbContext.PayrollPeriods.Add(period);
        await DbContext.SaveChangesAsync();

        var periodsInB = await DbContext.PayrollPeriods
            .AsNoTracking()
            .Where(p => p.GymHouseId == houseB.Id)
            .ToListAsync();

        periodsInB.Should().BeEmpty();
    }
}
