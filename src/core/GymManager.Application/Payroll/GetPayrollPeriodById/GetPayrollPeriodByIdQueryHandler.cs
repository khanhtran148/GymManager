using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Payroll.Shared;
using GymManager.Domain.Enums;
using Mapster;
using MediatR;

namespace GymManager.Application.Payroll.GetPayrollPeriodById;

public sealed class GetPayrollPeriodByIdQueryHandler(
    IPayrollPeriodRepository payrollPeriodRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetPayrollPeriodByIdQuery, Result<PayrollPeriodDetailDto>>
{
    public async Task<Result<PayrollPeriodDetailDto>> Handle(GetPayrollPeriodByIdQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewStaff, ct);
        if (!canView)
            return Result.Failure<PayrollPeriodDetailDto>(new ForbiddenError().ToString());

        var payrollPeriod = await payrollPeriodRepository.GetByIdWithEntriesAsync(request.Id, request.GymHouseId, ct);
        if (payrollPeriod is null)
            return Result.Failure<PayrollPeriodDetailDto>(new NotFoundError("PayrollPeriod", request.Id).ToString());

        return Result.Success(payrollPeriod.Adapt<PayrollPeriodDetailDto>());
    }
}
