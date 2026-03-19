using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.Bookings.CancelBooking;
using GymManager.Application.Bookings.CreateBooking;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.TimeSlots.CreateTimeSlot;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Bookings;

public sealed class CancelBookingCommandHandlerTests : ApplicationTestBase
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
    public async Task CancelBooking_Confirmed_Succeeds()
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

        var cancelResult = await Sender.Send(new CancelBookingCommand(bookingResult.Value.Id, gymHouseId));

        cancelResult.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task CancelBooking_AlreadyCancelled_Fails()
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

        // Cancel once
        await Sender.Send(new CancelBookingCommand(bookingResult.Value.Id, gymHouseId));

        // Cancel again
        var secondCancel = await Sender.Send(new CancelBookingCommand(bookingResult.Value.Id, gymHouseId));

        secondCancel.IsFailure.Should().BeTrue();
        secondCancel.Error.Should().Contain("already cancelled");
    }
}
