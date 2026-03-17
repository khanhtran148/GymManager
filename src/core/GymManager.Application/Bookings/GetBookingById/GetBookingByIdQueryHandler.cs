using CSharpFunctionalExtensions;
using GymManager.Application.Bookings.Shared;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using MediatR;
using static GymManager.Application.Bookings.Shared.BookingMapper;

namespace GymManager.Application.Bookings.GetBookingById;

public sealed class GetBookingByIdQueryHandler(
    IBookingRepository bookingRepository,
    IMemberRepository memberRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetBookingByIdQuery, Result<BookingDto>>
{
    public async Task<Result<BookingDto>> Handle(GetBookingByIdQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewBookings, ct);
        if (!canView)
            return Result.Failure<BookingDto>(new ForbiddenError().ToString());

        var booking = await bookingRepository.GetByIdAsync(request.Id, ct);
        if (booking is null)
            return Result.Failure<BookingDto>(new NotFoundError("Booking", request.Id).ToString());

        if (booking.GymHouseId != request.GymHouseId)
            return Result.Failure<BookingDto>(new NotFoundError("Booking", request.Id).ToString());

        var member = booking.Member ?? await memberRepository.GetByIdAsync(booking.MemberId, ct);

        return Result.Success(ToDto(booking, member!));
    }
}
