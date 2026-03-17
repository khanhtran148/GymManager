using CSharpFunctionalExtensions;
using GymManager.Application.Bookings.Shared;
using GymManager.Application.Common.Models;
using MediatR;

namespace GymManager.Application.Bookings.GetBookings;

public sealed record GetBookingsQuery(
    Guid GymHouseId,
    int Page,
    int PageSize,
    DateTime? From,
    DateTime? To) : IRequest<Result<PagedList<BookingDto>>>;
