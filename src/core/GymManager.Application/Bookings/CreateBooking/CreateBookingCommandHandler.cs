using CSharpFunctionalExtensions;
using GymManager.Application.Bookings.Shared;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using MediatR;
using static GymManager.Application.Bookings.Shared.BookingMapper;

namespace GymManager.Application.Bookings.CreateBooking;

public sealed class CreateBookingCommandHandler(
    IBookingRepository bookingRepository,
    ITimeSlotRepository timeSlotRepository,
    IClassScheduleRepository classScheduleRepository,
    IMemberRepository memberRepository,
    IWaitlistRepository waitlistRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser,
    IPublisher publisher)
    : IRequestHandler<CreateBookingCommand, Result<BookingDto>>
{
    public async Task<Result<BookingDto>> Handle(CreateBookingCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageBookings, ct);
        if (!canManage)
            return Result.Failure<BookingDto>(new ForbiddenError().ToString());

        var member = await memberRepository.GetByIdAsync(request.MemberId, ct);
        if (member is null)
            return Result.Failure<BookingDto>(new NotFoundError("Member", request.MemberId).ToString());

        if (member.GymHouseId != request.GymHouseId)
            return Result.Failure<BookingDto>(new NotFoundError("Member", request.MemberId).ToString());

        if (request.Type == BookingType.TimeSlot)
        {
            return await HandleTimeSlotBookingAsync(request, member, ct);
        }

        return await HandleClassSessionBookingAsync(request, member, ct);
    }

    private async Task<Result<BookingDto>> HandleTimeSlotBookingAsync(
        CreateBookingCommand request, Member member, CancellationToken ct)
    {
        var timeSlot = await timeSlotRepository.GetByIdForUpdateAsync(request.TimeSlotId!.Value, ct);
        if (timeSlot is null)
            return Result.Failure<BookingDto>(new NotFoundError("TimeSlot", request.TimeSlotId.Value).ToString());

        if (timeSlot.GymHouseId != request.GymHouseId)
            return Result.Failure<BookingDto>(new NotFoundError("TimeSlot", request.TimeSlotId.Value).ToString());

        if (timeSlot.CurrentBookings >= timeSlot.MaxCapacity)
        {
            var position = await waitlistRepository.GetNextPositionAsync(request.TimeSlotId, null, ct);
            var waitlistEntry = new Waitlist
            {
                MemberId = request.MemberId,
                GymHouseId = request.GymHouseId,
                BookingType = BookingType.TimeSlot,
                TimeSlotId = request.TimeSlotId,
                Position = position,
                AddedAt = DateTime.UtcNow
            };
            await waitlistRepository.AddAsync(waitlistEntry, ct);

            var waitlistedBooking = new Booking
            {
                MemberId = request.MemberId,
                GymHouseId = request.GymHouseId,
                BookingType = BookingType.TimeSlot,
                TimeSlotId = request.TimeSlotId,
                Status = BookingStatus.WaitListed,
                BookedAt = DateTime.UtcNow,
                Member = member
            };
            await bookingRepository.CreateAsync(waitlistedBooking, ct);

            return Result.Success(ToDto(waitlistedBooking, member));
        }

        timeSlot.CurrentBookings++;
        await timeSlotRepository.UpdateAsync(timeSlot, ct);

        var booking = new Booking
        {
            MemberId = request.MemberId,
            GymHouseId = request.GymHouseId,
            BookingType = BookingType.TimeSlot,
            TimeSlotId = request.TimeSlotId,
            Status = BookingStatus.Confirmed,
            BookedAt = DateTime.UtcNow,
            Member = member
        };
        await bookingRepository.CreateAsync(booking, ct);

        await publisher.Publish(new BookingConfirmedEvent(booking.Id, request.MemberId, request.GymHouseId), ct);

        return Result.Success(ToDto(booking, member));
    }

    private async Task<Result<BookingDto>> HandleClassSessionBookingAsync(
        CreateBookingCommand request, Member member, CancellationToken ct)
    {
        var classSchedule = await classScheduleRepository.GetByIdForUpdateAsync(request.ClassScheduleId!.Value, ct);
        if (classSchedule is null)
            return Result.Failure<BookingDto>(new NotFoundError("ClassSchedule", request.ClassScheduleId.Value).ToString());

        if (classSchedule.GymHouseId != request.GymHouseId)
            return Result.Failure<BookingDto>(new NotFoundError("ClassSchedule", request.ClassScheduleId.Value).ToString());

        if (classSchedule.CurrentEnrollment >= classSchedule.MaxCapacity)
        {
            var position = await waitlistRepository.GetNextPositionAsync(null, request.ClassScheduleId, ct);
            var waitlistEntry = new Waitlist
            {
                MemberId = request.MemberId,
                GymHouseId = request.GymHouseId,
                BookingType = BookingType.ClassSession,
                ClassScheduleId = request.ClassScheduleId,
                Position = position,
                AddedAt = DateTime.UtcNow
            };
            await waitlistRepository.AddAsync(waitlistEntry, ct);

            var waitlistedBooking = new Booking
            {
                MemberId = request.MemberId,
                GymHouseId = request.GymHouseId,
                BookingType = BookingType.ClassSession,
                ClassScheduleId = request.ClassScheduleId,
                Status = BookingStatus.WaitListed,
                BookedAt = DateTime.UtcNow,
                Member = member
            };
            await bookingRepository.CreateAsync(waitlistedBooking, ct);

            return Result.Success(ToDto(waitlistedBooking, member));
        }

        classSchedule.CurrentEnrollment++;
        await classScheduleRepository.UpdateAsync(classSchedule, ct);

        var booking = new Booking
        {
            MemberId = request.MemberId,
            GymHouseId = request.GymHouseId,
            BookingType = BookingType.ClassSession,
            ClassScheduleId = request.ClassScheduleId,
            Status = BookingStatus.Confirmed,
            BookedAt = DateTime.UtcNow,
            Member = member
        };
        await bookingRepository.CreateAsync(booking, ct);

        await publisher.Publish(new BookingConfirmedEvent(booking.Id, request.MemberId, request.GymHouseId), ct);

        return Result.Success(ToDto(booking, member));
    }

}
