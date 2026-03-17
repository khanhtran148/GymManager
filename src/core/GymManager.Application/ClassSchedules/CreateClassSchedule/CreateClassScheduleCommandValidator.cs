using FluentValidation;

namespace GymManager.Application.ClassSchedules.CreateClassSchedule;

public sealed class CreateClassScheduleCommandValidator : AbstractValidator<CreateClassScheduleCommand>
{
    public CreateClassScheduleCommandValidator()
    {
        RuleFor(x => x.GymHouseId)
            .NotEmpty().WithMessage("GymHouseId is required.");

        RuleFor(x => x.TrainerId)
            .NotEmpty().WithMessage("TrainerId is required.");

        RuleFor(x => x.ClassName)
            .NotEmpty().WithMessage("ClassName is required.")
            .MaximumLength(200).WithMessage("ClassName must not exceed 200 characters.");

        RuleFor(x => x.MaxCapacity)
            .GreaterThan(0).WithMessage("MaxCapacity must be greater than 0.");

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime).WithMessage("EndTime must be after StartTime.");
    }
}
