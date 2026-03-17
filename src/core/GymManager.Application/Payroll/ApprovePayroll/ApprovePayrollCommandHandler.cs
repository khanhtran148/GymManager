using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Payroll.Shared;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using Mapster;
using MediatR;

namespace GymManager.Application.Payroll.ApprovePayroll;

public sealed class ApprovePayrollCommandHandler(
    IPayrollPeriodRepository payrollPeriodRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser,
    IPublisher publisher)
    : IRequestHandler<ApprovePayrollCommand, Result<PayrollPeriodDetailDto>>
{
    public async Task<Result<PayrollPeriodDetailDto>> Handle(ApprovePayrollCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ApprovePayroll, ct);
        if (!canManage)
            return Result.Failure<PayrollPeriodDetailDto>(new ForbiddenError().ToString());

        var payrollPeriod = await payrollPeriodRepository.GetByIdWithEntriesAsync(request.Id, request.GymHouseId, ct);
        if (payrollPeriod is null)
            return Result.Failure<PayrollPeriodDetailDto>(new NotFoundError("PayrollPeriod", request.Id).ToString());

        if (payrollPeriod.Status != PayrollStatus.Draft)
            return Result.Failure<PayrollPeriodDetailDto>(
                new ConflictError($"Payroll period must be in Draft status to approve. Current status: {payrollPeriod.Status}.").ToString());

        payrollPeriod.Status = PayrollStatus.Approved;
        payrollPeriod.ApprovedById = currentUser.UserId;
        payrollPeriod.ApprovedAt = DateTime.UtcNow;

        await payrollPeriodRepository.UpdateAsync(payrollPeriod, ct);

        await publisher.Publish(new PayrollApprovedEvent(payrollPeriod.Id, payrollPeriod.GymHouseId), ct);

        var updated = await payrollPeriodRepository.GetByIdWithEntriesAsync(payrollPeriod.Id, request.GymHouseId, ct);
        return Result.Success(updated!.Adapt<PayrollPeriodDetailDto>());
    }
}
