using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.GymHouses.DeleteGymHouse;
using GymManager.Application.GymHouses.GetGymHouseById;
using GymManager.Application.GymHouses.GetGymHouses;
using GymManager.Application.GymHouses.Shared;
using GymManager.Application.GymHouses.UpdateGymHouse;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
public sealed class GymHousesController(ISender sender) : ApiControllerBase(sender)
{
    [HttpGet]
    [ProducesResponseType(typeof(List<GymHouseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await Sender.Send(new GetGymHousesQuery(), ct);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(GymHouseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new GetGymHouseByIdQuery(id), ct);
        return HandleResult(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(GymHouseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        [FromBody] CreateGymHouseCommand command, CancellationToken ct)
    {
        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(GymHouseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateGymHouseRequest request, CancellationToken ct)
    {
        var command = new UpdateGymHouseCommand(
            id, request.Name, request.Address, request.Phone, request.OperatingHours, request.HourlyCapacity);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}")]
    [EnableRateLimiting(RateLimitPolicies.Strict)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new DeleteGymHouseCommand(id), ct);
        return HandleResult(result);
    }
}

public sealed record UpdateGymHouseRequest(
    string Name,
    string Address,
    string? Phone,
    string? OperatingHours,
    int HourlyCapacity);
