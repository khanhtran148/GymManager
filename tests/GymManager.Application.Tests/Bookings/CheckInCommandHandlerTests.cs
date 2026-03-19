using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.Bookings.CheckIn;
using GymManager.Application.Bookings.CreateBooking;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.TimeSlots.CreateTimeSlot;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Bookings;

public sealed class CheckInCommandHandlerTests : ApplicationTestBase
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
    public async Task CheckIn_ConfirmedBooking_Succeeds()
    {
        var (_, gymHouseId) = await SetupAsync();

        var memberResult = await Sender.Send(new CreateMemberCommand(
            gymHouseId, $"m{Guid.NewGuid()}@example.com", "Member", null));

        var slotResult = await Sender.Send(new CreateTimeSlotCommand(
            gymHouseId,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            new TimeOnly(9, 0),
            new TimeOnly(10, 0),
            10));

        var bookingResult = await Sender.Send(new CreateBookingCommand(
            memberResult.Value.Id, gymHouseId, BookingType.TimeSlot, slotResult.Value.Id, null));
        bookingResult.IsSuccess.Should().BeTrue();

        var checkInResult = await Sender.Send(new CheckInCommand(
            bookingResult.Value.Id, gymHouseId, CheckInSource.ManualByStaff));

        checkInResult.IsSuccess.Should().BeTrue();
        checkInResult.Value.CheckedInAt.Should().NotBeNull();
        checkInResult.Value.CheckInSource.Should().Be(CheckInSource.ManualByStaff);
        checkInResult.Value.Status.Should().Be(BookingStatus.Completed);
    }

    [Fact]
    public async Task CheckIn_AlreadyCheckedIn_Fails()
    {
        var (_, gymHouseId) = await SetupAsync();

        var memberResult = await Sender.Send(new CreateMemberCommand(
            gymHouseId, $"m{Guid.NewGuid()}@example.com", "Member", null));

        var slotResult = await Sender.Send(new CreateTimeSlotCommand(
            gymHouseId,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)),
            new TimeOnly(10, 0),
            new TimeOnly(11, 0),
            10));

        var bookingResult = await Sender.Send(new CreateBookingCommand(
            memberResult.Value.Id, gymHouseId, BookingType.TimeSlot, slotResult.Value.Id, null));

        // Check in once
        await Sender.Send(new CheckInCommand(bookingResult.Value.Id, gymHouseId, CheckInSource.QRScan));

        // Check in again
        var second = await Sender.Send(new CheckInCommand(bookingResult.Value.Id, gymHouseId, CheckInSource.QRScan));

        second.IsFailure.Should().BeTrue();
        second.Error.Should().Contain("Cannot check in");
    }

    [Fact]
    public async Task CheckIn_WaitListedBooking_Fails()
    {
        var (_, gymHouseId) = await SetupAsync();

        var member1 = await Sender.Send(new CreateMemberCommand(
            gymHouseId, $"m{Guid.NewGuid()}@example.com", "Member1", null));
        var member2 = await Sender.Send(new CreateMemberCommand(
            gymHouseId, $"m{Guid.NewGuid()}@example.com", "Member2", null));

        var slotResult = await Sender.Send(new CreateTimeSlotCommand(
            gymHouseId,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
            new TimeOnly(14, 0),
            new TimeOnly(15, 0),
            1)); // capacity 1

        // Fill capacity
        await Sender.Send(new CreateBookingCommand(
            member1.Value.Id, gymHouseId, BookingType.TimeSlot, slotResult.Value.Id, null));

        // Waitlisted booking
        var waitlistedResult = await Sender.Send(new CreateBookingCommand(
            member2.Value.Id, gymHouseId, BookingType.TimeSlot, slotResult.Value.Id, null));
        waitlistedResult.Value.Status.Should().Be(BookingStatus.WaitListed);

        var checkIn = await Sender.Send(new CheckInCommand(waitlistedResult.Value.Id, gymHouseId, CheckInSource.QRScan));

        checkIn.IsFailure.Should().BeTrue();
        checkIn.Error.Should().Contain("WaitListed");
    }
}
