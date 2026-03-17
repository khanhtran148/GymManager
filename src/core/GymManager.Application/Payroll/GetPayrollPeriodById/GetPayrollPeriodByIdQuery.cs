using CSharpFunctionalExtensions;
using GymManager.Application.Payroll.Shared;
using MediatR;

namespace GymManager.Application.Payroll.GetPayrollPeriodById;

public sealed record GetPayrollPeriodByIdQuery(Guid Id, Guid GymHouseId) : IRequest<Result<PayrollPeriodDetailDto>>;
