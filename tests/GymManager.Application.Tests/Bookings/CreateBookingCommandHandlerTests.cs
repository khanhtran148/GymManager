using FluentAssertions;
using GymManager.Application.Bookings.CreateBooking;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.TimeSlots.CreateTimeSlot;
using GymManager.Application.ClassSchedules.CreateClassSchedule;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Bookings;

public sealed class CreateBookingCommandHandlerTests : ApplicationTestBase
{
    private async Task<(Guid UserId, Guid GymHouseId)> SetupOwnerAndHouseAsync()
    {
        var (owner, gymHouse) = await CreateOwnerAsync(
            $"owner{Guid.NewGuid()}@example.com", "Booking Test Gym");
        return (owner.Id, gymHouse.Id);
    }

    private async Task<Guid> CreateTestMemberAsync(Guid gymHouseId)
    {
        var result = await Sender.Send(new CreateMemberCommand(
            gymHouseId, $"member{Guid.NewGuid()}@example.com", "Test Member", null));
        return result.Value.Id;
    }

    [Fact]
    public async Task CreateBooking_TimeSlot_Success()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var memberId = await CreateTestMemberAsync(gymHouseId);

        var slotResult = await Sender.Send(new CreateTimeSlotCommand(
            gymHouseId,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            new TimeOnly(9, 0),
            new TimeOnly(10, 0),
            10));
        slotResult.IsSuccess.Should().BeTrue();

        var command = new CreateBookingCommand(
            memberId, gymHouseId, BookingType.TimeSlot, slotResult.Value.Id, null);
        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Status.Should().Be(BookingStatus.Confirmed);
        result.Value.BookingType.Should().Be(BookingType.TimeSlot);
        result.Value.TimeSlotId.Should().Be(slotResult.Value.Id);
    }

    [Fact]
    public async Task CreateBooking_ClassSession_Success()
    {
        var (userId, gymHouseId) = await SetupOwnerAndHouseAsync();
        var memberId = await CreateTestMemberAsync(gymHouseId);

        var classResult = await Sender.Send(new CreateClassScheduleCommand(
            gymHouseId, userId, "Yoga",
            DayOfWeek.Monday,
            new TimeOnly(9, 0),
            new TimeOnly(10, 0),
            10, true));
        classResult.IsSuccess.Should().BeTrue();

        var command = new CreateBookingCommand(
            memberId, gymHouseId, BookingType.ClassSession, null, classResult.Value.Id);
        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Status.Should().Be(BookingStatus.Confirmed);
        result.Value.BookingType.Should().Be(BookingType.ClassSession);
    }

    [Fact]
    public async Task CreateBooking_CapacityFull_ReturnsWaitListed()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        var memberId1 = await CreateTestMemberAsync(gymHouseId);
        var memberId2 = await CreateTestMemberAsync(gymHouseId);

        var slotResult = await Sender.Send(new CreateTimeSlotCommand(
            gymHouseId,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)),
            new TimeOnly(11, 0),
            new TimeOnly(12, 0),
            1)); // capacity of 1
        slotResult.IsSuccess.Should().BeTrue();

        // First booking fills capacity
        var first = await Sender.Send(new CreateBookingCommand(
            memberId1, gymHouseId, BookingType.TimeSlot, slotResult.Value.Id, null));
        first.IsSuccess.Should().BeTrue();
        first.Value.Status.Should().Be(BookingStatus.Confirmed);

        // Second booking should be waitlisted
        var second = await Sender.Send(new CreateBookingCommand(
            memberId2, gymHouseId, BookingType.TimeSlot, slotResult.Value.Id, null));
        second.IsSuccess.Should().BeTrue();
        second.Value.Status.Should().Be(BookingStatus.WaitListed);
    }

    [Fact]
    public async Task CreateBooking_MemberNotFound_Fails()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var slotResult = await Sender.Send(new CreateTimeSlotCommand(
            gymHouseId,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
            new TimeOnly(14, 0),
            new TimeOnly(15, 0),
            10));

        var command = new CreateBookingCommand(
            Guid.NewGuid(), gymHouseId, BookingType.TimeSlot, slotResult.Value.Id, null);
        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task CreateBooking_PermissionDenied_Fails()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        CurrentUser.Permissions = Permission.ViewMembers; // No ManageBookings

        var command = new CreateBookingCommand(
            Guid.NewGuid(), gymHouseId, BookingType.TimeSlot, Guid.NewGuid(), null);
        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }
}
