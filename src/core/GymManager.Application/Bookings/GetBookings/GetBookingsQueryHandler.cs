using CSharpFunctionalExtensions;
using GymManager.Application.Bookings.Shared;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Bookings.GetBookings;

public sealed class GetBookingsQueryHandler(
    IBookingRepository bookingRepository,
    IMemberRepository memberRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetBookingsQuery, Result<PagedList<BookingDto>>>
{
    public async Task<Result<PagedList<BookingDto>>> Handle(GetBookingsQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewBookings, ct);
        if (!canView)
            return Result.Failure<PagedList<BookingDto>>(new ForbiddenError().ToString());

        var pagedBookings = await bookingRepository.GetByGymHouseAsync(
            request.GymHouseId, request.Page, request.PageSize, request.From, request.To, ct);

        var dtos = new List<BookingDto>(pagedBookings.Items.Count);
        foreach (var booking in pagedBookings.Items)
        {
            var member = booking.Member ?? await memberRepository.GetByIdAsync(booking.MemberId, ct);
            dtos.Add(BookingMapper.ToDto(booking, member!));
        }

        return Result.Success(new PagedList<BookingDto>(
            dtos, pagedBookings.TotalCount, pagedBookings.Page, pagedBookings.PageSize));
    }
}
