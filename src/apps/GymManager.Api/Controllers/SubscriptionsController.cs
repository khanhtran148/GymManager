using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.Subscriptions.CancelSubscription;
using GymManager.Application.Subscriptions.FreezeSubscription;
using GymManager.Application.Subscriptions.RenewSubscription;
using GymManager.Application.Subscriptions.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
public sealed class SubscriptionsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost("{id:guid}/renew")]
    [ProducesResponseType(typeof(SubscriptionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Renew(
        Guid id, [FromBody] RenewSubscriptionRequest request, CancellationToken ct)
    {
        var command = new RenewSubscriptionCommand(
            id, request.GymHouseId, request.StartDate, request.EndDate, request.Price);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/freeze")]
    [ProducesResponseType(typeof(SubscriptionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Freeze(
        Guid id, [FromBody] FreezeSubscriptionRequest request, CancellationToken ct)
    {
        var command = new FreezeSubscriptionCommand(id, request.GymHouseId, request.FrozenUntil);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/cancel")]
    [EnableRateLimiting(RateLimitPolicies.Strict)]
    [ProducesResponseType(typeof(SubscriptionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Cancel(
        Guid id, [FromBody] CancelSubscriptionRequest request, CancellationToken ct)
    {
        var command = new CancelSubscriptionCommand(id, request.GymHouseId);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }
}

public sealed record RenewSubscriptionRequest(
    Guid GymHouseId,
    DateTime StartDate,
    DateTime EndDate,
    decimal Price);

public sealed record FreezeSubscriptionRequest(
    Guid GymHouseId,
    DateTime FrozenUntil);

public sealed record CancelSubscriptionRequest(Guid GymHouseId);
