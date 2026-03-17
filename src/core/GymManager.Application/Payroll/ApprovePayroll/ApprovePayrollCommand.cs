using CSharpFunctionalExtensions;
using GymManager.Application.Payroll.Shared;
using MediatR;

namespace GymManager.Application.Payroll.ApprovePayroll;

public sealed record ApprovePayrollCommand(Guid Id, Guid GymHouseId) : IRequest<Result<PayrollPeriodDetailDto>>;
