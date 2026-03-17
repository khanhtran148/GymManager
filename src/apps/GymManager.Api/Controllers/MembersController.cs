using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.Members.GetMemberById;
using GymManager.Application.Members.GetMembers;
using GymManager.Application.Members.Shared;
using GymManager.Application.Members.UpdateMember;
using GymManager.Application.Subscriptions.CreateSubscription;
using GymManager.Application.Subscriptions.GetSubscriptionsByMember;
using GymManager.Application.Subscriptions.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
[Route("api/v{version:apiVersion}/gymhouses/{gymHouseId:guid}/members")]
public sealed class MembersController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [ProducesResponseType(typeof(GymManager.Application.Common.Models.PagedList<MemberDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(
        Guid gymHouseId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetMembersQuery(gymHouseId, page, pageSize, search), ct);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(MemberDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid gymHouseId, Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new GetMemberByIdQuery(id, gymHouseId), ct);
        return HandleResult(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(MemberDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        Guid gymHouseId,
        [FromBody] CreateMemberRequest request,
        CancellationToken ct)
    {
        var command = new CreateMemberCommand(gymHouseId, request.Email, request.FullName, request.Phone);
        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return CreatedAtAction(nameof(GetById), new { gymHouseId, id = result.Value.Id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(MemberDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid gymHouseId,
        Guid id,
        [FromBody] UpdateMemberRequest request,
        CancellationToken ct)
    {
        var command = new UpdateMemberCommand(id, gymHouseId, request.FullName, request.Phone);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpGet("{memberId:guid}/subscriptions")]
    [ProducesResponseType(typeof(List<SubscriptionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetSubscriptions(
        Guid gymHouseId, Guid memberId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetSubscriptionsByMemberQuery(memberId, gymHouseId), ct);
        return HandleResult(result);
    }

    [HttpPost("{memberId:guid}/subscriptions")]
    [ProducesResponseType(typeof(SubscriptionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateSubscription(
        Guid gymHouseId,
        Guid memberId,
        [FromBody] CreateSubscriptionRequest request,
        CancellationToken ct)
    {
        var command = new CreateSubscriptionCommand(
            memberId, gymHouseId, request.Type, request.Price, request.StartDate, request.EndDate);
        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return CreatedAtAction(nameof(GetSubscriptions), new { gymHouseId, memberId }, result.Value);
    }
}

public sealed record CreateMemberRequest(string Email, string FullName, string? Phone);
public sealed record UpdateMemberRequest(string FullName, string? Phone);
public sealed record CreateSubscriptionRequest(
    GymManager.Domain.Enums.SubscriptionType Type,
    decimal Price,
    DateTime StartDate,
    DateTime EndDate);
