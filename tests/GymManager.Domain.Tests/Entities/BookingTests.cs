using FluentAssertions;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Tests.Common.Builders;
using Xunit;

namespace GymManager.Domain.Tests.Entities;

public sealed class BookingTests
{
    [Fact]
    public void Booking_Created_WithCorrectTimeSlotType()
    {
        var booking = new BookingBuilder()
            .WithBookingType(BookingType.TimeSlot)
            .WithTimeSlotId(Guid.NewGuid())
            .WithStatus(BookingStatus.Confirmed)
            .Build();

        booking.BookingType.Should().Be(BookingType.TimeSlot);
        booking.Status.Should().Be(BookingStatus.Confirmed);
        booking.TimeSlotId.Should().NotBeEmpty();
        booking.ClassScheduleId.Should().BeNull();
    }

    [Fact]
    public void Booking_Created_WithCorrectClassSessionType()
    {
        var booking = new BookingBuilder()
            .WithBookingType(BookingType.ClassSession)
            .WithClassScheduleId(Guid.NewGuid())
            .WithStatus(BookingStatus.Confirmed)
            .Build();

        booking.BookingType.Should().Be(BookingType.ClassSession);
        booking.Status.Should().Be(BookingStatus.Confirmed);
        booking.ClassScheduleId.Should().NotBeEmpty();
        booking.TimeSlotId.Should().BeNull();
    }

    [Fact]
    public void CheckIn_SetsTimestampAndSource()
    {
        var booking = new BookingBuilder()
            .WithStatus(BookingStatus.Confirmed)
            .Build();

        var before = DateTime.UtcNow;
        booking.CheckIn(CheckInSource.ManualByStaff);

        booking.CheckedInAt.Should().NotBeNull();
        booking.CheckedInAt.Should().BeOnOrAfter(before);
        booking.CheckInSource.Should().Be(CheckInSource.ManualByStaff);
        booking.Status.Should().Be(BookingStatus.Completed);
    }

    [Fact]
    public void Cancel_ChangesStatusToCancelled()
    {
        var booking = new BookingBuilder()
            .WithStatus(BookingStatus.Confirmed)
            .Build();

        booking.Cancel();

        booking.Status.Should().Be(BookingStatus.Cancelled);
    }

    [Fact]
    public void MarkNoShow_ChangesStatusToNoShow()
    {
        var booking = new BookingBuilder()
            .WithStatus(BookingStatus.Confirmed)
            .Build();

        booking.MarkNoShow();

        booking.Status.Should().Be(BookingStatus.NoShow);
    }

    [Fact]
    public void Complete_ChangesStatusToCompleted()
    {
        var booking = new BookingBuilder()
            .WithStatus(BookingStatus.Confirmed)
            .Build();

        booking.Complete();

        booking.Status.Should().Be(BookingStatus.Completed);
    }

    [Theory]
    [InlineData(CheckInSource.QRScan)]
    [InlineData(CheckInSource.ManualByStaff)]
    [InlineData(CheckInSource.SelfKiosk)]
    public void CheckIn_WithAnySource_RecordsCorrectSource(CheckInSource source)
    {
        var booking = new BookingBuilder().WithStatus(BookingStatus.Confirmed).Build();

        booking.CheckIn(source);

        booking.CheckInSource.Should().Be(source);
    }
}
