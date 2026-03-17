using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Payroll.ApprovePayroll;
using GymManager.Application.Payroll.CreatePayrollPeriod;
using GymManager.Application.Staff.CreateStaff;
using GymManager.Domain.Enums;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GymManager.Application.Tests.Payroll;

public sealed class ApprovePayrollCommandHandlerTests : ApplicationTestBase
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
    public async Task ApprovePayroll_DraftStatus_ChangesToApproved()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var created = await Sender.Send(new CreatePayrollPeriodCommand(
            gymHouseId,
            new DateOnly(2026, 6, 1),
            new DateOnly(2026, 6, 30)));

        created.IsSuccess.Should().BeTrue();
        created.Value.Status.Should().Be(PayrollStatus.Draft);

        var approved = await Sender.Send(new ApprovePayrollCommand(created.Value.Id, gymHouseId));

        approved.IsSuccess.Should().BeTrue();
        approved.Value.Status.Should().Be(PayrollStatus.Approved);
        approved.Value.ApprovedById.Should().Be(CurrentUser.UserId);
        approved.Value.ApprovedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ApprovePayroll_AlreadyApproved_ReturnsConflict()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var created = await Sender.Send(new CreatePayrollPeriodCommand(
            gymHouseId,
            new DateOnly(2026, 7, 1),
            new DateOnly(2026, 7, 31)));

        await Sender.Send(new ApprovePayrollCommand(created.Value.Id, gymHouseId));

        var secondApproval = await Sender.Send(new ApprovePayrollCommand(created.Value.Id, gymHouseId));

        secondApproval.IsFailure.Should().BeTrue();
        secondApproval.Error.Should().Contain("must be in Draft status");
    }

    [Fact]
    public async Task ApprovePayroll_NotFound_ReturnsFailure()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var result = await Sender.Send(new ApprovePayrollCommand(Guid.NewGuid(), gymHouseId));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task ApprovePayroll_WithoutPermission_ReturnsForbidden()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var created = await Sender.Send(new CreatePayrollPeriodCommand(
            gymHouseId,
            new DateOnly(2026, 8, 1),
            new DateOnly(2026, 8, 31)));

        CurrentUser.Permissions = Permission.None;

        var result = await Sender.Send(new ApprovePayrollCommand(created.Value.Id, gymHouseId));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }

    [Fact]
    public async Task ApprovePayroll_PublishesPayrollApprovedEvent()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var reg = await Sender.Send(new RegisterCommand($"staff{Guid.NewGuid()}@example.com", "Password123!", "Staff", null));
        await Sender.Send(new CreateStaffCommand(reg.Value.UserId, gymHouseId, StaffType.Reception, 3000m, 0m));

        var created = await Sender.Send(new CreatePayrollPeriodCommand(
            gymHouseId,
            new DateOnly(2026, 9, 1),
            new DateOnly(2026, 9, 30)));

        var result = await Sender.Send(new ApprovePayrollCommand(created.Value.Id, gymHouseId));

        result.IsSuccess.Should().BeTrue();
        result.Value.Status.Should().Be(PayrollStatus.Approved);
    }
}
