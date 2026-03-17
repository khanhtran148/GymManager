using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Payroll.CreatePayrollPeriod;
using GymManager.Application.Staff.CreateStaff;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Payroll;

public sealed class CreatePayrollPeriodCommandHandlerTests : ApplicationTestBase
{
    private async Task<(Guid OwnerId, Guid GymHouseId)> SetupOwnerAndHouseAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123!", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var house = await Sender.Send(new CreateGymHouseCommand("Test Gym", "123 St", null, null, 50));
        return (reg.Value.UserId, house.Value.Id);
    }

    [Fact]
    public async Task CreatePayrollPeriod_GeneratesEntriesForAllStaff()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var reg1 = await Sender.Send(new RegisterCommand($"trainer{Guid.NewGuid()}@example.com", "Password123!", "Trainer One", null));
        await Sender.Send(new CreateStaffCommand(reg1.Value.UserId, gymHouseId, StaffType.Trainer, 6000m, 100m));

        var reg2 = await Sender.Send(new RegisterCommand($"reception{Guid.NewGuid()}@example.com", "Password123!", "Reception One", null));
        await Sender.Send(new CreateStaffCommand(reg2.Value.UserId, gymHouseId, StaffType.Reception, 3000m, 0m));

        var command = new CreatePayrollPeriodCommand(
            gymHouseId,
            new DateOnly(2026, 1, 1),
            new DateOnly(2026, 1, 31));

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.GymHouseId.Should().Be(gymHouseId);
        result.Value.Entries.Should().HaveCount(2);
        result.Value.Status.Should().Be(PayrollStatus.Draft);
    }

    [Fact]
    public async Task CreatePayrollPeriod_CorrectNetPayCalculation()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var reg = await Sender.Send(new RegisterCommand($"trainer{Guid.NewGuid()}@example.com", "Password123!", "Trainer", null));
        await Sender.Send(new CreateStaffCommand(reg.Value.UserId, gymHouseId, StaffType.Trainer, 5000m, 50m));

        var command = new CreatePayrollPeriodCommand(
            gymHouseId,
            new DateOnly(2026, 2, 1),
            new DateOnly(2026, 2, 28));

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        var entry = result.Value.Entries.First();
        entry.BasePay.Should().Be(5000m);
        entry.NetPay.Should().Be(entry.BasePay + entry.ClassBonus - entry.Deductions);
    }

    [Fact]
    public async Task CreatePayrollPeriod_NoStaff_ReturnsEmptyEntries()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var command = new CreatePayrollPeriodCommand(
            gymHouseId,
            new DateOnly(2026, 3, 1),
            new DateOnly(2026, 3, 31));

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Entries.Should().BeEmpty();
    }

    [Fact]
    public async Task CreatePayrollPeriod_OverlappingPeriod_ReturnsConflict()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        await Sender.Send(new CreatePayrollPeriodCommand(
            gymHouseId,
            new DateOnly(2026, 4, 1),
            new DateOnly(2026, 4, 30)));

        var overlapping = await Sender.Send(new CreatePayrollPeriodCommand(
            gymHouseId,
            new DateOnly(2026, 4, 15),
            new DateOnly(2026, 5, 15)));

        overlapping.IsFailure.Should().BeTrue();
        overlapping.Error.Should().Contain("Overlapping");
    }

    [Fact]
    public async Task CreatePayrollPeriod_WithoutPermission_ReturnsForbidden()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        CurrentUser.Permissions = Permission.None;

        var command = new CreatePayrollPeriodCommand(
            gymHouseId,
            new DateOnly(2026, 5, 1),
            new DateOnly(2026, 5, 31));

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }
}
