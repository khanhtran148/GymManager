using CSharpFunctionalExtensions;
using MediatR;

namespace GymManager.Application.Bookings.MarkNoShow;

public sealed record MarkNoShowCommand(
    Guid BookingId,
    Guid GymHouseId) : IRequest<Result>;
