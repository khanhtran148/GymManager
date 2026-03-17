using FluentAssertions;
using GymManager.Tests.Common.Builders;
using Xunit;

namespace GymManager.Domain.Tests.Entities;

public sealed class TimeSlotTests
{
    [Fact]
    public void TimeSlot_WithCurrentBookingsLessThanCapacity_HasAvailableSpots()
    {
        var timeSlot = new TimeSlotBuilder()
            .WithMaxCapacity(10)
            .WithCurrentBookings(5)
            .Build();

        var availableSpots = timeSlot.MaxCapacity - timeSlot.CurrentBookings;

        availableSpots.Should().Be(5);
    }

    [Fact]
    public void TimeSlot_WithCurrentBookingsEqualToCapacity_IsAtCapacity()
    {
        var timeSlot = new TimeSlotBuilder()
            .WithMaxCapacity(10)
            .WithCurrentBookings(10)
            .Build();

        var isFull = timeSlot.CurrentBookings >= timeSlot.MaxCapacity;

        isFull.Should().BeTrue();
    }

    [Fact]
    public void TimeSlot_DefaultCurrentBookings_IsZero()
    {
        var timeSlot = new TimeSlotBuilder()
            .WithMaxCapacity(20)
            .Build();

        timeSlot.CurrentBookings.Should().Be(0);
    }

    [Fact]
    public void TimeSlot_HasCorrectTimeRange()
    {
        var start = new TimeOnly(9, 0);
        var end = new TimeOnly(10, 0);

        var timeSlot = new TimeSlotBuilder()
            .WithStartTime(start)
            .WithEndTime(end)
            .Build();

        timeSlot.StartTime.Should().Be(start);
        timeSlot.EndTime.Should().Be(end);
        (timeSlot.EndTime > timeSlot.StartTime).Should().BeTrue();
    }
}
