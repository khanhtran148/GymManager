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

        return MapErrorToResult(result.Error);
    }

    protected IActionResult HandleResult(Result result)
    {
        if (result.IsSuccess)
            return NoContent();

        return MapErrorToResult(result.Error);
    }

    protected IActionResult HandleResult<T>(Result<T, NotFoundError> result) =>
        result.IsSuccess ? Ok(result.Value) : NotFound(ToProblem("Not Found", StripPrefix(result.Error.ToString()), 404));

    protected IActionResult HandleResult<T>(Result<T, ForbiddenError> result) =>
        result.IsSuccess ? Ok(result.Value) : StatusCode(403, ToProblem("Forbidden", StripPrefix(result.Error.ToString()), 403));

    protected IActionResult HandleResult<T>(Result<T, ConflictError> result) =>
        result.IsSuccess ? Ok(result.Value) : Conflict(ToProblem("Conflict", StripPrefix(result.Error.ToString()), 409));

    private IActionResult MapErrorToResult(string error) => error switch
    {
        var e when e.StartsWith("[NOT_FOUND]", StringComparison.Ordinal) =>
            NotFound(ToProblem("Not Found", StripPrefix(e), 404)),
        var e when e.StartsWith("[FORBIDDEN]", StringComparison.Ordinal) =>
            StatusCode(403, ToProblem("Forbidden", StripPrefix(e), 403)),
        var e when e.StartsWith("[CONFLICT]", StringComparison.Ordinal) =>
            Conflict(ToProblem("Conflict", StripPrefix(e), 409)),
        var e => BadRequest(ToProblem("Bad Request", e, 400))
    };

    private static string StripPrefix(string error)
    {
        var closeBracket = error.IndexOf(']');
        return closeBracket >= 0 ? error[(closeBracket + 1)..].TrimStart() : error;
    }

    private ProblemDetails ToProblem(string title, string detail, int status) => new()
    {
        Title = title,
        Status = status,
        Detail = detail,
        Instance = HttpContext.Request.Path
    };
}
