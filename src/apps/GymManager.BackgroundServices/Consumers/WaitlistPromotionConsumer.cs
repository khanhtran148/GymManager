using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using MassTransit;
using MediatR;

namespace GymManager.BackgroundServices.Consumers;

public sealed class WaitlistPromotionConsumer(
    IWaitlistRepository waitlistRepository,
    IBookingRepository bookingRepository,
    ITimeSlotRepository timeSlotRepository,
    IClassScheduleRepository classScheduleRepository,
    IPublisher publisher) : IConsumer<BookingCancelledEvent>
{
    public async Task Consume(ConsumeContext<BookingCancelledEvent> context)
    {
        var evt = context.Message;
        var ct = context.CancellationToken;

        var next = await waitlistRepository.GetNextInLineAsync(evt.TimeSlotId, evt.ClassScheduleId, ct);
        if (next is null)
            return;

        // Create new confirmed booking for the waitlisted member
        var booking = new Booking
        {
            MemberId = next.MemberId,
            GymHouseId = evt.GymHouseId,
            BookingType = evt.Type,
            TimeSlotId = evt.TimeSlotId,
            ClassScheduleId = evt.ClassScheduleId,
            Status = BookingStatus.Confirmed,
            BookedAt = DateTime.UtcNow
        };

        await bookingRepository.CreateAsync(booking, ct);

        // Increment capacity counter for the promoted booking
        if (evt.Type == BookingType.TimeSlot && evt.TimeSlotId.HasValue)
        {
            var timeSlot = await timeSlotRepository.GetByIdForUpdateAsync(evt.TimeSlotId.Value, ct);
            if (timeSlot is not null)
            {
                timeSlot.CurrentBookings++;
                await timeSlotRepository.UpdateAsync(timeSlot, ct);
            }
        }
        else if (evt.Type == BookingType.ClassSession && evt.ClassScheduleId.HasValue)
        {
            var classSchedule = await classScheduleRepository.GetByIdForUpdateAsync(evt.ClassScheduleId.Value, ct);
            if (classSchedule is not null)
            {
                classSchedule.CurrentEnrollment++;
                await classScheduleRepository.UpdateAsync(classSchedule, ct);
            }
        }

        // Mark waitlist entry as promoted
        next.PromotedAt = DateTime.UtcNow;
        await waitlistRepository.UpdateAsync(next, ct);

        await publisher.Publish(new WaitlistPromotedEvent(next.Id, booking.Id, next.MemberId), ct);
    }
}
