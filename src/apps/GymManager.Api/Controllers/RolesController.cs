using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.Roles.ChangeUserRole;
using GymManager.Application.Roles.GetRolePermissions;
using GymManager.Application.Roles.GetRoleUsers;
using GymManager.Application.Roles.ResetDefaultPermissions;
using GymManager.Application.Roles.Shared;
using GymManager.Application.Roles.UpdateRolePermissions;
using GymManager.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
[Route("api/v{version:apiVersion}/roles")]
public sealed class RolesController(ISender sender) : ApiControllerBase(sender)
{
    /// <summary>List all roles with their current permission bitmasks for the caller's tenant.</summary>
    [HttpGet("permissions")]
    [ProducesResponseType(typeof(List<RolePermissionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPermissions(CancellationToken ct)
    {
        var result = await Sender.Send(new GetRolePermissionsQuery(), ct);
        return HandleResult(result);
    }

    /// <summary>Update permissions bitmask for a specific role within the caller's tenant.</summary>
    [HttpPut("{role}/permissions")]
    [EnableRateLimiting(RateLimitPolicies.Strict)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateRolePermissions(
        [FromRoute] Role role,
        [FromBody] UpdatePermissionsRequest request,
        CancellationToken ct)
    {
        var command = new UpdateRolePermissionsCommand(role, request.Permissions);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Reset all role permissions to seed defaults for the caller's tenant.</summary>
    [HttpPost("reset-defaults")]
    [EnableRateLimiting(RateLimitPolicies.Strict)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ResetDefaults(CancellationToken ct)
    {
        var result = await Sender.Send(new ResetDefaultPermissionsCommand(), ct);
        return HandleResult(result);
    }

    /// <summary>List users with a given role within the caller's tenant.</summary>
    [HttpGet("{role}/users")]
    [ProducesResponseType(typeof(GymManager.Application.Common.Models.PagedList<RoleUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRoleUsers(
        [FromRoute] Role role,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetRoleUsersQuery(role, page, pageSize), ct);
        return HandleResult(result);
    }
}

/// <summary>
/// Controller for user-specific role mutations (separate route prefix /users).
/// </summary>
[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
[Route("api/v{version:apiVersion}/users")]
public sealed class UserRoleController(ISender sender) : ApiControllerBase(sender)
{
    /// <summary>Change a user's role.</summary>
    [HttpPut("{userId:guid}/role")]
    [EnableRateLimiting(RateLimitPolicies.Strict)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangeUserRole(
        Guid userId,
        [FromBody] ChangeUserRoleRequest request,
        CancellationToken ct)
    {
        var command = new ChangeUserRoleCommand(userId, request.Role);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }
}

public sealed record UpdatePermissionsRequest(string Permissions);
public sealed record ChangeUserRoleRequest(Role Role);
