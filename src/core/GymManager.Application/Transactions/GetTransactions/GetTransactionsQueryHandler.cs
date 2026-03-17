using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Transactions.Shared;
using GymManager.Domain.Enums;
using Mapster;
using MediatR;

namespace GymManager.Application.Transactions.GetTransactions;

public sealed class GetTransactionsQueryHandler(
    ITransactionRepository transactionRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetTransactionsQuery, Result<PagedList<TransactionDto>>>
{
    public async Task<Result<PagedList<TransactionDto>>> Handle(GetTransactionsQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewFinance, ct);
        if (!canView)
            return Result.Failure<PagedList<TransactionDto>>(new ForbiddenError().ToString());

        var paged = await transactionRepository.GetByGymHouseAsync(
            request.GymHouseId,
            request.From,
            request.To,
            request.Type,
            request.Direction,
            request.Page,
            request.PageSize,
            ct);

        var dtos = new PagedList<TransactionDto>(
            paged.Items.Adapt<List<TransactionDto>>(),
            paged.TotalCount,
            paged.Page,
            paged.PageSize);

        return Result.Success(dtos);
    }
}
