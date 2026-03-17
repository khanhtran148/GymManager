using CSharpFunctionalExtensions;
using GymManager.Application.Common.Models;
using GymManager.Application.Transactions.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Transactions.GetTransactions;

public sealed record GetTransactionsQuery(
    Guid GymHouseId,
    int Page,
    int PageSize,
    TransactionType? Type,
    TransactionDirection? Direction,
    DateTime? From,
    DateTime? To) : IRequest<Result<PagedList<TransactionDto>>>;
