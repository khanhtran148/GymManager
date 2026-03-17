using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.TimeSlots.CreateTimeSlot;
using GymManager.Application.TimeSlots.GetTimeSlots;
using GymManager.Application.TimeSlots.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
[Route("api/v{version:apiVersion}/gymhouses/{gymHouseId:guid}/time-slots")]
public sealed class TimeSlotsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost]
    [ProducesResponseType(typeof(TimeSlotDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        Guid gymHouseId,
        [FromBody] CreateTimeSlotRequest request,
        CancellationToken ct)
    {
        var command = new CreateTimeSlotCommand(
            gymHouseId, request.Date, request.StartTime, request.EndTime, request.MaxCapacity);
        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return CreatedAtAction(nameof(GetAll), new { gymHouseId }, result.Value);
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<TimeSlotDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(
        Guid gymHouseId,
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetTimeSlotsQuery(gymHouseId, from, to), ct);
        return HandleResult(result);
    }
}

public sealed record CreateTimeSlotRequest(
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int MaxCapacity);
