using CSharpFunctionalExtensions;
using GymManager.Application.Bookings.Shared;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using MediatR;
using static GymManager.Application.Bookings.Shared.BookingMapper;

namespace GymManager.Application.Bookings.CheckIn;

public sealed class CheckInCommandHandler(
    IBookingRepository bookingRepository,
    IMemberRepository memberRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<CheckInCommand, Result<BookingDto>>
{
    public async Task<Result<BookingDto>> Handle(CheckInCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageBookings, ct);
        if (!canManage)
            return Result.Failure<BookingDto>(new ForbiddenError().ToString());

        var booking = await bookingRepository.GetByIdAsync(request.BookingId, ct);
        if (booking is null)
            return Result.Failure<BookingDto>(new NotFoundError("Booking", request.BookingId).ToString());

        if (booking.GymHouseId != request.GymHouseId)
            return Result.Failure<BookingDto>(new NotFoundError("Booking", request.BookingId).ToString());

        if (booking.Status != BookingStatus.Confirmed)
            return Result.Failure<BookingDto>(new ConflictError($"Cannot check in a booking with status '{booking.Status}'.").ToString());

        if (booking.CheckedInAt.HasValue)
            return Result.Failure<BookingDto>(new ConflictError("Member is already checked in.").ToString());

        booking.CheckIn(request.Source);
        await bookingRepository.UpdateAsync(booking, ct);

        var member = await memberRepository.GetByIdAsync(booking.MemberId, ct);
        if (member is null)
            return Result.Failure<BookingDto>(new NotFoundError("Member", booking.MemberId).ToString());

        return Result.Success(ToDto(booking, member));
    }
}
