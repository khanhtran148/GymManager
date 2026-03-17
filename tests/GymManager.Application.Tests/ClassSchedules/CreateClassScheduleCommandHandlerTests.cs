using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.ClassSchedules.CreateClassSchedule;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.ClassSchedules;

public sealed class CreateClassScheduleCommandHandlerTests : ApplicationTestBase
{
    private async Task<(Guid UserId, Guid GymHouseId)> SetupAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var house = await Sender.Send(new CreateGymHouseCommand("Test Gym", "123 Test St", null, null, 50));
        return (reg.Value.UserId, house.Value.Id);
    }

    [Fact]
    public async Task CreateClassSchedule_ValidData_Succeeds()
    {
        var (userId, gymHouseId) = await SetupAsync();

        var command = new CreateClassScheduleCommand(
            gymHouseId, userId, "Yoga",
            DayOfWeek.Monday,
            new TimeOnly(9, 0),
            new TimeOnly(10, 0),
            20, true);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.GymHouseId.Should().Be(gymHouseId);
        result.Value.TrainerId.Should().Be(userId);
        result.Value.ClassName.Should().Be("Yoga");
        result.Value.MaxCapacity.Should().Be(20);
        result.Value.CurrentEnrollment.Should().Be(0);
        result.Value.AvailableSpots.Should().Be(20);
    }

    [Fact]
    public async Task CreateClassSchedule_TrainerDoubleBooked_Fails()
    {
        var (userId, gymHouseId) = await SetupAsync();

        // Create first class
        await Sender.Send(new CreateClassScheduleCommand(
            gymHouseId, userId, "Yoga",
            DayOfWeek.Monday,
            new TimeOnly(9, 0),
            new TimeOnly(10, 0),
            10, true));

        // Try to create overlapping class with same trainer
        var second = await Sender.Send(new CreateClassScheduleCommand(
            gymHouseId, userId, "Pilates",
            DayOfWeek.Monday,
            new TimeOnly(9, 30),
            new TimeOnly(10, 30),
            10, true));

        second.IsFailure.Should().BeTrue();
        second.Error.Should().Contain("already assigned");
    }

    [Fact]
    public async Task CreateClassSchedule_TrainerNotFound_Fails()
    {
        var (_, gymHouseId) = await SetupAsync();

        var command = new CreateClassScheduleCommand(
            gymHouseId, Guid.NewGuid(), "Yoga",
            DayOfWeek.Monday,
            new TimeOnly(9, 0),
            new TimeOnly(10, 0),
            10, true);

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("not found");
    }
}
