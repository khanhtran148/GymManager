using FluentValidation;

namespace GymManager.Application.TimeSlots.CreateTimeSlot;

public sealed class CreateTimeSlotCommandValidator : AbstractValidator<CreateTimeSlotCommand>
{
    public CreateTimeSlotCommandValidator()
    {
        RuleFor(x => x.GymHouseId)
            .NotEmpty().WithMessage("GymHouseId is required.");

        RuleFor(x => x.MaxCapacity)
            .GreaterThan(0).WithMessage("MaxCapacity must be greater than 0.");

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime).WithMessage("EndTime must be after StartTime.");
    }
}
