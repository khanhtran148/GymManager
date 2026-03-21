using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.Auth.Shared;
using GymManager.Application.Invitations.AcceptInvitation;
using GymManager.Application.Invitations.CreateInvitation;
using GymManager.Application.Invitations.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
public sealed class InvitationsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost]
    [ProducesResponseType(typeof(InvitationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreateInvitationCommand command, CancellationToken ct)
    {
        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return CreatedAtAction(nameof(Create), new { }, result.Value);
    }

    [HttpPost("{token}/accept")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Accept(
        [FromRoute] string token,
        [FromBody] AcceptInvitationBody body,
        CancellationToken ct)
    {
        var command = new AcceptInvitationCommand(token, body.Password, body.FullName);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }
}

/// <summary>
/// Request body for accepting an invitation.
/// Password and FullName are required only for new users; existing users may omit them.
/// </summary>
public sealed record AcceptInvitationBody(string? Password, string? FullName);
