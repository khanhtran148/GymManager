using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.TimeSlots.Shared;
using GymManager.Domain.Enums;
using MediatR;
using static GymManager.Application.TimeSlots.Shared.TimeSlotMapper;

namespace GymManager.Application.TimeSlots.GetTimeSlots;

public sealed class GetTimeSlotsQueryHandler(
    ITimeSlotRepository timeSlotRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetTimeSlotsQuery, Result<List<TimeSlotDto>>>
{
    public async Task<Result<List<TimeSlotDto>>> Handle(GetTimeSlotsQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewBookings, ct);
        if (!canView)
            return Result.Failure<List<TimeSlotDto>>(new ForbiddenError().ToString());

        var timeSlots = await timeSlotRepository.GetByDateRangeAsync(
            request.GymHouseId, request.From, request.To, ct);

        return Result.Success(timeSlots.Select(ToDto).ToList());
    }
}
