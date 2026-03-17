using GymManager.Api.Common;
using GymManager.Application.Announcements.CreateAnnouncement;
using GymManager.Application.Announcements.GetAnnouncementById;
using GymManager.Application.Announcements.GetAnnouncements;
using GymManager.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
public sealed class AnnouncementsController(ISender sender, ICurrentUser currentUser)
    : ApiControllerBase(sender)
{
    [HttpPost]
    [ProducesResponseType(typeof(GymManager.Application.Announcements.Shared.AnnouncementDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        [FromBody] CreateAnnouncementRequest body, CancellationToken ct)
    {
        var command = new CreateAnnouncementCommand(
            body.GymHouseId,
            currentUser.UserId,
            body.Title,
            body.Content,
            body.TargetAudience,
            body.PublishAt);

        var result = await Sender.Send(command, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value)
            : HandleResult(result);
    }

    [HttpGet]
    [ProducesResponseType(typeof(GymManager.Application.Common.Models.PagedList<GymManager.Application.Announcements.Shared.AnnouncementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetList(
        [FromQuery] Guid gymHouseId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var clampedPageSize = Math.Min(pageSize, 100);
        var result = await Sender.Send(new GetAnnouncementsQuery(gymHouseId, page, clampedPageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(GymManager.Application.Announcements.Shared.AnnouncementDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        Guid id,
        [FromQuery] Guid gymHouseId,
        CancellationToken ct)
    {
        var result = await Sender.Send(new GetAnnouncementByIdQuery(id, gymHouseId), ct);
        return result.IsSuccess ? Ok(result.Value) : HandleResult(result);
    }
}

public sealed record CreateAnnouncementRequest(
    Guid? GymHouseId,
    string Title,
    string Content,
    GymManager.Domain.Enums.TargetAudience TargetAudience,
    DateTime PublishAt);
