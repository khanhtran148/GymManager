using CSharpFunctionalExtensions;
using GymManager.Application.Payroll.Shared;
using MediatR;

namespace GymManager.Application.Payroll.CreatePayrollPeriod;

public sealed record CreatePayrollPeriodCommand(
    Guid GymHouseId,
    DateOnly PeriodStart,
    DateOnly PeriodEnd) : IRequest<Result<PayrollPeriodDetailDto>>;
