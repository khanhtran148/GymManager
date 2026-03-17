using CSharpFunctionalExtensions;
using GymManager.Application.Bookings.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Bookings.CreateBooking;

public sealed record CreateBookingCommand(
    Guid MemberId,
    Guid GymHouseId,
    BookingType Type,
    Guid? TimeSlotId,
    Guid? ClassScheduleId) : IRequest<Result<BookingDto>>;
