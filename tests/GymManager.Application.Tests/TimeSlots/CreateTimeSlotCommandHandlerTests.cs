using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.TimeSlots.CreateTimeSlot;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.TimeSlots;

public sealed class CreateTimeSlotCommandHandlerTests : ApplicationTestBase
{
    private async Task<(Guid UserId, Guid GymHouseId)> SetupAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123!", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var house = await Sender.Send(new CreateGymHouseCommand("Test Gym", "123 Test St", null, null, 50));
        return (reg.Value.UserId, house.Value.Id);
    }

    [Fact]
    public async Task CreateTimeSlot_ValidData_Succeeds()
    {
        var (_, gymHouseId) = await SetupAsync();

        var command = new CreateTimeSlotCommand(
            gymHouseId,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            new TimeOnly(9, 0),
            new TimeOnly(10, 0),
            20);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.GymHouseId.Should().Be(gymHouseId);
        result.Value.MaxCapacity.Should().Be(20);
        result.Value.CurrentBookings.Should().Be(0);
        result.Value.AvailableSpots.Should().Be(20);
    }

    [Fact]
    public async Task CreateTimeSlot_OverlappingSlot_Fails()
    {
        var (_, gymHouseId) = await SetupAsync();
        var date = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5));

        // Create first slot
        await Sender.Send(new CreateTimeSlotCommand(
            gymHouseId, date, new TimeOnly(9, 0), new TimeOnly(10, 0), 10));

        // Try to create overlapping slot
        var overlapping = await Sender.Send(new CreateTimeSlotCommand(
            gymHouseId, date, new TimeOnly(9, 30), new TimeOnly(10, 30), 10));

        overlapping.IsFailure.Should().BeTrue();
        overlapping.Error.Should().Contain("overlaps");
    }

    [Fact]
    public async Task CreateTimeSlot_PermissionDenied_Fails()
    {
        var (_, gymHouseId) = await SetupAsync();
        CurrentUser.Permissions = Permission.ViewBookings; // No ManageSchedule

        var command = new CreateTimeSlotCommand(
            gymHouseId,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            new TimeOnly(9, 0),
            new TimeOnly(10, 0),
            10);

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }
}
