using Asp.Versioning;
using GymManager.Api.Common;
using GymManager.Application.Common.Models;
using GymManager.Application.Transactions.GetTransactions;
using GymManager.Application.Transactions.RecordTransaction;
using GymManager.Application.Transactions.ReverseTransaction;
using GymManager.Application.Transactions.Shared;
using GymManager.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GymManager.Api.Controllers;

[ApiVersion("1.0")]
[Authorize]
[EnableRateLimiting(RateLimitPolicies.Default)]
[Route("api/v{version:apiVersion}/gymhouses/{gymHouseId:guid}/transactions")]
public sealed class TransactionsController(ISender sender) : ApiControllerBase(sender)
{
    [HttpPost]
    [ProducesResponseType(typeof(TransactionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Record(
        Guid gymHouseId,
        [FromBody] RecordTransactionRequest request,
        CancellationToken ct)
    {
        var command = new RecordTransactionCommand(
            gymHouseId,
            request.TransactionType,
            request.Direction,
            request.Amount,
            request.Category,
            request.Description,
            request.TransactionDate,
            request.RelatedEntityId,
            request.ApprovedById,
            request.PaymentMethod,
            request.ExternalReference);

        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return CreatedAtAction(nameof(GetAll), new { gymHouseId }, result.Value);
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedList<TransactionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(
        Guid gymHouseId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] TransactionType? type = null,
        [FromQuery] TransactionDirection? direction = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetTransactionsQuery(gymHouseId, page, pageSize, type, direction, from, to), ct);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/reverse")]
    [EnableRateLimiting(RateLimitPolicies.Strict)]
    [ProducesResponseType(typeof(TransactionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Reverse(
        Guid gymHouseId,
        Guid id,
        [FromBody] ReverseTransactionRequest request,
        CancellationToken ct)
    {
        var command = new ReverseTransactionCommand(gymHouseId, id, request.Reason);
        var result = await Sender.Send(command, ct);
        if (result.IsFailure)
            return HandleResult(result);

        return CreatedAtAction(nameof(GetAll), new { gymHouseId }, result.Value);
    }
}

public sealed record RecordTransactionRequest(
    TransactionType TransactionType,
    TransactionDirection Direction,
    decimal Amount,
    TransactionCategory Category,
    string Description,
    DateTime TransactionDate,
    Guid? RelatedEntityId,
    Guid? ApprovedById,
    PaymentMethod? PaymentMethod,
    string? ExternalReference);

public sealed record ReverseTransactionRequest(string Reason);
