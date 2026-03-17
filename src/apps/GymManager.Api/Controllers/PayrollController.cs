using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.Common.Models;
using GymManager.Application.Payroll.ApprovePayroll;
using GymManager.Application.Payroll.CreatePayrollPeriod;
using GymManager.Application.Payroll.GetPayrollPeriodById;
using GymManager.Application.Payroll.GetPayrollPeriods;
using GymManager.Application.Payroll.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
[Route("api/v{version:apiVersion}/payroll-periods")]
public sealed class PayrollController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost]
    [ProducesResponseType(typeof(PayrollPeriodDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreatePayrollPeriodRequest request, CancellationToken ct)
    {
        var command = new CreatePayrollPeriodCommand(request.GymHouseId, request.PeriodStart, request.PeriodEnd);
        var result = await Sender.Send(command, ct);
        return result.IsFailure
            ? HandleResult(result)
            : CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value);
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedList<PayrollPeriodDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid gymHouseId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetPayrollPeriodsQuery(gymHouseId, page, pageSize), ct);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PayrollPeriodDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        Guid id,
        [FromQuery] Guid gymHouseId,
        CancellationToken ct)
    {
        var result = await Sender.Send(new GetPayrollPeriodByIdQuery(id, gymHouseId), ct);
        return HandleResult(result);
    }

    [HttpPatch("{id:guid}/approve")]
    [EnableRateLimiting(RateLimitPolicies.Strict)]
    [ProducesResponseType(typeof(PayrollPeriodDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Approve(
        Guid id,
        [FromQuery] Guid gymHouseId,
        CancellationToken ct)
    {
        var command = new ApprovePayrollCommand(id, gymHouseId);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }
}

public sealed record CreatePayrollPeriodRequest(
    Guid GymHouseId,
    DateOnly PeriodStart,
    DateOnly PeriodEnd);
