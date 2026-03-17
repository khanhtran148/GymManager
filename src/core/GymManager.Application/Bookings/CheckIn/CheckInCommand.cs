using CSharpFunctionalExtensions;
using GymManager.Application.Bookings.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Bookings.CheckIn;

public sealed record CheckInCommand(
    Guid BookingId,
    Guid GymHouseId,
    CheckInSource Source) : IRequest<Result<BookingDto>>;
