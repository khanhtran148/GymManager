using GymManager.Api.Common;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Notifications.GetPreferences;
using GymManager.Application.Notifications.Shared;
using GymManager.Application.Notifications.UpdatePreferences;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
[Route("api/v{version:apiVersion}/notification-preferences")]
[ApiController]
public sealed class NotificationPreferencesController(ISender sender, ICurrentUser currentUser)
    : ApiControllerBase(sender)
{
    [HttpGet]
    [ProducesResponseType(typeof(List<NotificationPreferenceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPreferences(CancellationToken ct)
    {
        var result = await Sender.Send(new GetNotificationPreferencesQuery(currentUser.UserId), ct);
        return result.IsSuccess ? Ok(result.Value) : HandleResult(result);
    }

    [HttpPut]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdatePreferences(
        [FromBody] UpdateNotificationPreferencesRequest body,
        CancellationToken ct)
    {
        var command = new UpdateNotificationPreferencesCommand(
            currentUser.UserId,
            body.Preferences.Select(p => new NotificationPreferenceItem(p.Channel, p.IsEnabled)).ToList());

        var result = await Sender.Send(command, ct);
        return result.IsSuccess ? NoContent() : HandleResult(result);
    }
}

public sealed record UpdateNotificationPreferencesRequest(
    List<NotificationPreferenceItemRequest> Preferences);

public sealed record NotificationPreferenceItemRequest(
    GymManager.Domain.Enums.NotificationChannel Channel,
    bool IsEnabled);
