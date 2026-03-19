using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.Notifications.GetNotifications;
using GymManager.Application.Notifications.MarkNotificationRead;
using GymManager.Application.Notifications.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
public sealed class NotificationsController(ISender sender)
    : ApiControllerBase(sender)
{
    [HttpGet]
    [ProducesResponseType(typeof(GymManager.Application.Common.Models.PagedList<NotificationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var clampedPageSize = Math.Min(pageSize, 100);
        var result = await Sender.Send(new GetNotificationsQuery(page, clampedPageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : HandleResult(result);
    }

    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new MarkNotificationReadCommand(id), ct);
        return result.IsSuccess ? NoContent() : HandleResult(result);
    }
}
