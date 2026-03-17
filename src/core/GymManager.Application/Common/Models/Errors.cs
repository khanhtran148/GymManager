namespace GymManager.Application.Common.Models;

public sealed record NotFoundError(string Resource, object Id)
{
    public override string ToString() => $"{Resource} with id '{Id}' was not found.";
}

public sealed record ForbiddenError(string? Message = null)
{
    public override string ToString() => Message ?? "Access denied.";
}

public sealed record ValidationError(IReadOnlyList<ValidationFailure> Failures);

public sealed record ValidationFailure(string Property, string Message);

public sealed record ConflictError(string Message)
{
    public override string ToString() => Message;
}
