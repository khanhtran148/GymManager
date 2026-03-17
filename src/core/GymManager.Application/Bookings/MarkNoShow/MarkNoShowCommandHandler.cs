using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Bookings.MarkNoShow;

public sealed class MarkNoShowCommandHandler(
    IBookingRepository bookingRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<MarkNoShowCommand, Result>
{
    public async Task<Result> Handle(MarkNoShowCommand request, CancellationToken ct)
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

        if (booking.Status != BookingStatus.Confirmed)
            return Result.Failure(new ConflictError($"Cannot mark a booking as no-show with status '{booking.Status}'.").ToString());

        booking.MarkNoShow();
        await bookingRepository.UpdateAsync(booking, ct);

        return Result.Success();
    }
}
