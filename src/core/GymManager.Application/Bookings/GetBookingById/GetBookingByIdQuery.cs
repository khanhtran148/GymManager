using CSharpFunctionalExtensions;
using GymManager.Application.Bookings.Shared;
using MediatR;

namespace GymManager.Application.Bookings.GetBookingById;

public sealed record GetBookingByIdQuery(
    Guid Id,
    Guid GymHouseId) : IRequest<Result<BookingDto>>;
