using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace GymManager.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title, detail) = exception switch
        {
            ValidationException ve => (StatusCodes.Status422UnprocessableEntity, "Validation failed",
                string.Join("; ", ve.Errors.Select(e => e.ErrorMessage))),
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "Unauthorized", exception.Message),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred.", null)
        };

        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        };

        if (exception is ValidationException validationException)
        {
            problem.Extensions["errors"] = validationException.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = statusCode;

        await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
    }
}
