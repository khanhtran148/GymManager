using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.TimeSlots.Shared;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.TimeSlots.CreateTimeSlot;

public sealed class CreateTimeSlotCommandHandler(
    ITimeSlotRepository timeSlotRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<CreateTimeSlotCommand, Result<TimeSlotDto>>
{
    public async Task<Result<TimeSlotDto>> Handle(CreateTimeSlotCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageSchedule, ct);
        if (!canManage)
            return Result.Failure<TimeSlotDto>(new ForbiddenError().ToString());

        var hasOverlap = await timeSlotRepository.HasOverlapAsync(
            request.GymHouseId, request.Date, request.StartTime, request.EndTime, ct);
        if (hasOverlap)
            return Result.Failure<TimeSlotDto>(new ConflictError("A time slot already exists that overlaps with the requested time range.").ToString());

        var timeSlot = new TimeSlot
        {
            GymHouseId = request.GymHouseId,
            Date = request.Date,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            MaxCapacity = request.MaxCapacity,
            CurrentBookings = 0
        };

        await timeSlotRepository.CreateAsync(timeSlot, ct);

        return Result.Success(ToDto(timeSlot));
    }

    internal static TimeSlotDto ToDto(TimeSlot ts) => new(
        ts.Id,
        ts.GymHouseId,
        ts.Date,
        ts.StartTime,
        ts.EndTime,
        ts.MaxCapacity,
        ts.CurrentBookings,
        ts.MaxCapacity - ts.CurrentBookings);
}
