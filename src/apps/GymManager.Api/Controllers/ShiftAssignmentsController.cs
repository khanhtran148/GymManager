using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.ShiftAssignments.CreateShiftAssignment;
using GymManager.Application.ShiftAssignments.GetShiftAssignments;
using GymManager.Application.ShiftAssignments.Shared;
using GymManager.Application.ShiftAssignments.UpdateShiftAssignment;
using GymManager.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
[Route("api/v{version:apiVersion}/shift-assignments")]
public sealed class ShiftAssignmentsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost]
    [ProducesResponseType(typeof(ShiftAssignmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateShiftAssignmentRequest request, CancellationToken ct)
    {
        var command = new CreateShiftAssignmentCommand(
            request.StaffId,
            request.GymHouseId,
            request.ShiftDate,
            request.StartTime,
            request.EndTime,
            request.ShiftType);

        var result = await Sender.Send(command, ct);
        return result.IsFailure
            ? HandleResult(result)
            : CreatedAtAction(nameof(GetAll), new { gymHouseId = request.GymHouseId }, result.Value);
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<ShiftAssignmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid gymHouseId,
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        [FromQuery] Guid? staffId = null,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetShiftAssignmentsQuery(gymHouseId, from, to, staffId), ct);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ShiftAssignmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromQuery] Guid gymHouseId,
        [FromBody] UpdateShiftAssignmentRequest request,
        CancellationToken ct)
    {
        var command = new UpdateShiftAssignmentCommand(
            id, gymHouseId, request.ShiftDate, request.StartTime, request.EndTime, request.ShiftType, request.Status);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }
}

public sealed record CreateShiftAssignmentRequest(
    Guid StaffId,
    Guid GymHouseId,
    DateOnly ShiftDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    ShiftType ShiftType);

public sealed record UpdateShiftAssignmentRequest(
    DateOnly ShiftDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    ShiftType ShiftType,
    ShiftStatus Status);
