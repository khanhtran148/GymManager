using CSharpFunctionalExtensions;
using MediatR;

namespace GymManager.Application.Bookings.CancelBooking;

public sealed record CancelBookingCommand(
    Guid BookingId,
    Guid GymHouseId) : IRequest<Result>;
