using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using MediatR;

namespace GymManager.Application.Bookings.CancelBooking;

public sealed class CancelBookingCommandHandler(
    IBookingRepository bookingRepository,
    ITimeSlotRepository timeSlotRepository,
    IClassScheduleRepository classScheduleRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser,
    IPublisher publisher)
    : IRequestHandler<CancelBookingCommand, Result>
{
    public async Task<Result> Handle(CancelBookingCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageBookings, ct);
        if (!canManage)
            return Result.Failure(new ForbiddenError().ToString());

        var booking = await bookingRepository.GetByIdAsync(request.BookingId, ct);
        if (booking is null)
            return Result.Failure(new NotFoundError("Booking", request.BookingId).ToString());

        if (booking.GymHouseId != request.GymHouseId)
            return Result.Failure(new NotFoundError("Booking", request.BookingId).ToString());

        if (booking.Status == BookingStatus.Cancelled)
            return Result.Failure(new ConflictError("Booking is already cancelled.").ToString());

        if (booking.Status != BookingStatus.Confirmed)
            return Result.Failure(new ConflictError($"Cannot cancel a booking with status '{booking.Status}'.").ToString());

        booking.Cancel();
        await bookingRepository.UpdateAsync(booking, ct);

        // Decrement capacity counter
        if (booking.BookingType == BookingType.TimeSlot && booking.TimeSlotId.HasValue)
        {
            var timeSlot = await timeSlotRepository.GetByIdForUpdateAsync(booking.TimeSlotId.Value, ct);
            if (timeSlot is not null && timeSlot.CurrentBookings > 0)
            {
                timeSlot.CurrentBookings--;
                await timeSlotRepository.UpdateAsync(timeSlot, ct);
            }
        }
        else if (booking.BookingType == BookingType.ClassSession && booking.ClassScheduleId.HasValue)
        {
            var classSchedule = await classScheduleRepository.GetByIdForUpdateAsync(booking.ClassScheduleId.Value, ct);
            if (classSchedule is not null && classSchedule.CurrentEnrollment > 0)
            {
                classSchedule.CurrentEnrollment--;
                await classScheduleRepository.UpdateAsync(classSchedule, ct);
            }
        }

        await publisher.Publish(new BookingCancelledEvent(
            booking.Id,
            booking.MemberId,
            booking.GymHouseId,
            booking.BookingType,
            booking.TimeSlotId,
            booking.ClassScheduleId), ct);

        return Result.Success();
    }
}
