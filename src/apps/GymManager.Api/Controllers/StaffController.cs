using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.Common.Models;
using GymManager.Application.Staff.CreateStaff;
using GymManager.Application.Staff.GetStaff;
using GymManager.Application.Staff.GetStaffById;
using GymManager.Application.Staff.Shared;
using GymManager.Application.Staff.UpdateStaff;
using GymManager.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
[Route("api/v{version:apiVersion}/staff")]
public sealed class StaffController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost]
    [ProducesResponseType(typeof(StaffDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateStaffRequest request, CancellationToken ct)
    {
        var command = new CreateStaffCommand(
            request.UserId,
            request.GymHouseId,
            request.StaffType,
            request.BaseSalary,
            request.PerClassBonus);

        var result = await Sender.Send(command, ct);
        return result.IsFailure
            ? HandleResult(result)
            : CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value);
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedList<StaffDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid gymHouseId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] StaffType? staffType = null,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetStaffQuery(gymHouseId, page, pageSize, staffType), ct);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(StaffDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        Guid id,
        [FromQuery] Guid gymHouseId,
        CancellationToken ct)
    {
        var result = await Sender.Send(new GetStaffByIdQuery(id, gymHouseId), ct);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(StaffDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromQuery] Guid gymHouseId,
        [FromBody] UpdateStaffRequest request,
        CancellationToken ct)
    {
        var command = new UpdateStaffCommand(id, gymHouseId, request.StaffType, request.BaseSalary, request.PerClassBonus);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }
}

public sealed record CreateStaffRequest(
    Guid UserId,
    Guid GymHouseId,
    StaffType StaffType,
    decimal BaseSalary,
    decimal PerClassBonus);

public sealed record UpdateStaffRequest(
    StaffType StaffType,
    decimal BaseSalary,
    decimal PerClassBonus);
