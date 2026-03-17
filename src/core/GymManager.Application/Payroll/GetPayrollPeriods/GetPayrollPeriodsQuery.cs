using CSharpFunctionalExtensions;
using GymManager.Application.Common.Models;
using GymManager.Application.Payroll.Shared;
using MediatR;

namespace GymManager.Application.Payroll.GetPayrollPeriods;

public sealed record GetPayrollPeriodsQuery(
    Guid GymHouseId,
    int Page,
    int PageSize) : IRequest<Result<PagedList<PayrollPeriodDto>>>;
