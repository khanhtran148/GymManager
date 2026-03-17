using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.Bookings.CancelBooking;
using GymManager.Application.Bookings.CheckIn;
using GymManager.Application.Bookings.CreateBooking;
using GymManager.Application.Bookings.GetBookingById;
using GymManager.Application.Bookings.GetBookings;
using GymManager.Application.Bookings.MarkNoShow;
using GymManager.Application.Bookings.Shared;
using GymManager.Application.Common.Models;
using GymManager.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
[Route("api/v{version:apiVersion}/gymhouses/{gymHouseId:guid}/bookings")]
public sealed class BookingsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(
        Guid gymHouseId,
        [FromBody] CreateBookingRequest request,
        CancellationToken ct)
    {
        var command = new CreateBookingCommand(
            request.MemberId, gymHouseId, request.Type, request.TimeSlotId, request.ClassScheduleId);
        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return CreatedAtAction(nameof(GetById), new { gymHouseId, id = result.Value.Id }, result.Value);
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedList<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(
        Guid gymHouseId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetBookingsQuery(gymHouseId, page, pageSize, from, to), ct);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid gymHouseId, Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new GetBookingByIdQuery(id, gymHouseId), ct);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(Guid gymHouseId, Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new CancelBookingCommand(id, gymHouseId), ct);
        return HandleResult(result);
    }

    [HttpPatch("{id:guid}/check-in")]
    [ProducesResponseType(typeof(BookingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CheckIn(
        Guid gymHouseId,
        Guid id,
        [FromBody] CheckInRequest request,
        CancellationToken ct)
    {
        var result = await Sender.Send(new CheckInCommand(id, gymHouseId, request.Source), ct);
        return HandleResult(result);
    }

    [HttpPatch("{id:guid}/no-show")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkNoShow(Guid gymHouseId, Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new MarkNoShowCommand(id, gymHouseId), ct);
        return HandleResult(result);
    }
}

public sealed record CreateBookingRequest(
    Guid MemberId,
    BookingType Type,
    Guid? TimeSlotId,
    Guid? ClassScheduleId);

public sealed record CheckInRequest(CheckInSource Source);
