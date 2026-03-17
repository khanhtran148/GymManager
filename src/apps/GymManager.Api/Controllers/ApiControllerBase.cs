using CSharpFunctionalExtensions;
using GymManager.Application.Common.Models;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace GymManager.Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
public abstract class ApiControllerBase(ISender sender) : ControllerBase
{
    protected ISender Sender { get; } = sender;

    protected IActionResult HandleResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
            return Ok(result.Value);

        return result.Error switch
        {
            var e when e.Contains("not found", StringComparison.OrdinalIgnoreCase) =>
                NotFound(ToProblem(e, 404)),
            var e when e.Contains("Access denied", StringComparison.OrdinalIgnoreCase) ||
                       e.Contains("Forbidden", StringComparison.OrdinalIgnoreCase) =>
                StatusCode(403, ToProblem(e, 403)),
            var e when e.Contains("already", StringComparison.OrdinalIgnoreCase) =>
                Conflict(ToProblem(e, 409)),
            var e => BadRequest(ToProblem(e, 400))
        };
    }

    protected IActionResult HandleResult(Result result)
    {
        if (result.IsSuccess)
            return NoContent();

        return result.Error switch
        {
            var e when e.Contains("not found", StringComparison.OrdinalIgnoreCase) =>
                NotFound(ToProblem(e, 404)),
            var e when e.Contains("Access denied", StringComparison.OrdinalIgnoreCase) ||
                       e.Contains("Forbidden", StringComparison.OrdinalIgnoreCase) =>
                StatusCode(403, ToProblem(e, 403)),
            var e when e.Contains("already", StringComparison.OrdinalIgnoreCase) =>
                Conflict(ToProblem(e, 409)),
            var e => BadRequest(ToProblem(e, 400))
        };
    }

    protected IActionResult HandleResult<T>(Result<T, NotFoundError> result) =>
        result.IsSuccess ? Ok(result.Value) : NotFound(ToProblem(result.Error.ToString(), 404));

    protected IActionResult HandleResult<T>(Result<T, ForbiddenError> result) =>
        result.IsSuccess ? Ok(result.Value) : StatusCode(403, ToProblem(result.Error.ToString(), 403));

    protected IActionResult HandleResult<T>(Result<T, ConflictError> result) =>
        result.IsSuccess ? Ok(result.Value) : Conflict(ToProblem(result.Error.ToString(), 409));

    private ProblemDetails ToProblem(string detail, int status) => new()
    {
        Status = status,
        Detail = detail,
        Instance = HttpContext.Request.Path
    };
}
