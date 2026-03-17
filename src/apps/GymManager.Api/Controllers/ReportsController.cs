using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.Reports.GetPnLReport;
using GymManager.Application.Reports.GetRevenueMetrics;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
[Route("api/v{version:apiVersion}/gymhouses/{gymHouseId:guid}/reports")]
public sealed class ReportsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet("pnl")]
    [ProducesResponseType(typeof(PnLReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPnL(
        Guid gymHouseId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        CancellationToken ct)
    {
        var result = await Sender.Send(new GetPnLReportQuery(gymHouseId, from, to), ct);
        return HandleResult(result);
    }

    [HttpGet("revenue-metrics")]
    [ProducesResponseType(typeof(RevenueMetricsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRevenueMetrics(
        Guid gymHouseId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        CancellationToken ct)
    {
        var result = await Sender.Send(new GetRevenueMetricsQuery(gymHouseId, from, to), ct);
        return HandleResult(result);
    }
}
