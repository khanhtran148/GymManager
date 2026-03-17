using FluentValidation;
using GymManager.Domain.Enums;

namespace GymManager.Application.Bookings.CreateBooking;

public sealed class CreateBookingCommandValidator : AbstractValidator<CreateBookingCommand>
{
    public CreateBookingCommandValidator()
    {
        RuleFor(x => x.GymHouseId)
            .NotEmpty().WithMessage("GymHouseId is required.");

        RuleFor(x => x.MemberId)
            .NotEmpty().WithMessage("MemberId is required.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("BookingType must be a valid value.");

        RuleFor(x => x.TimeSlotId)
            .NotEmpty().WithMessage("TimeSlotId is required for TimeSlot bookings.")
            .When(x => x.Type == BookingType.TimeSlot);

        RuleFor(x => x.ClassScheduleId)
            .NotEmpty().WithMessage("ClassScheduleId is required for ClassSession bookings.")
            .When(x => x.Type == BookingType.ClassSession);
    }
}
