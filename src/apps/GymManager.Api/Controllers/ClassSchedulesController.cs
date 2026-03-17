using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.ClassSchedules.CreateClassSchedule;
using GymManager.Application.ClassSchedules.GetClassScheduleById;
using GymManager.Application.ClassSchedules.GetClassSchedules;
using GymManager.Application.ClassSchedules.Shared;
using GymManager.Application.ClassSchedules.UpdateClassSchedule;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
[Route("api/v{version:apiVersion}/gymhouses/{gymHouseId:guid}/class-schedules")]
public sealed class ClassSchedulesController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost]
    [ProducesResponseType(typeof(ClassScheduleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        Guid gymHouseId,
        [FromBody] CreateClassScheduleRequest request,
        CancellationToken ct)
    {
        var command = new CreateClassScheduleCommand(
            gymHouseId, request.TrainerId, request.ClassName,
            request.DayOfWeek, request.StartTime, request.EndTime,
            request.MaxCapacity, request.IsRecurring);
        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return CreatedAtAction(nameof(GetById), new { gymHouseId, id = result.Value.Id }, result.Value);
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<ClassScheduleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(
        Guid gymHouseId,
        [FromQuery] DayOfWeek? dayOfWeek = null,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetClassSchedulesQuery(gymHouseId, dayOfWeek), ct);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ClassScheduleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid gymHouseId, Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new GetClassScheduleByIdQuery(id, gymHouseId), ct);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ClassScheduleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(
        Guid gymHouseId,
        Guid id,
        [FromBody] UpdateClassScheduleRequest request,
        CancellationToken ct)
    {
        var command = new UpdateClassScheduleCommand(
            id, gymHouseId, request.ClassName,
            request.DayOfWeek, request.StartTime, request.EndTime,
            request.MaxCapacity, request.IsRecurring);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }
}

public sealed record CreateClassScheduleRequest(
    Guid TrainerId,
    string ClassName,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int MaxCapacity,
    bool IsRecurring);

public sealed record UpdateClassScheduleRequest(
    string ClassName,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int MaxCapacity,
    bool IsRecurring);
