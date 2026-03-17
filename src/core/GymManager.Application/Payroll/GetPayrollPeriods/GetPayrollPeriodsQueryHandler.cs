using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Payroll.Shared;
using GymManager.Domain.Enums;
using Mapster;
using MediatR;

namespace GymManager.Application.Payroll.GetPayrollPeriods;

public sealed class GetPayrollPeriodsQueryHandler(
    IPayrollPeriodRepository payrollPeriodRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetPayrollPeriodsQuery, Result<PagedList<PayrollPeriodDto>>>
{
    public async Task<Result<PagedList<PayrollPeriodDto>>> Handle(GetPayrollPeriodsQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewStaff, ct);
        if (!canView)
            return Result.Failure<PagedList<PayrollPeriodDto>>(new ForbiddenError().ToString());

        var paged = await payrollPeriodRepository.GetByGymHouseAsync(
            request.GymHouseId, request.Page, request.PageSize, ct);

        var dtos = new PagedList<PayrollPeriodDto>(
            paged.Items.Adapt<List<PayrollPeriodDto>>(),
            paged.TotalCount,
            paged.Page,
            paged.PageSize);

        return Result.Success(dtos);
    }
}
