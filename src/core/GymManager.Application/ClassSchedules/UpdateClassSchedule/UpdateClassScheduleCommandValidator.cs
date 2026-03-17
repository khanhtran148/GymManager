using FluentValidation;

namespace GymManager.Application.ClassSchedules.UpdateClassSchedule;

public sealed class UpdateClassScheduleCommandValidator : AbstractValidator<UpdateClassScheduleCommand>
{
    public UpdateClassScheduleCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");

        RuleFor(x => x.GymHouseId)
            .NotEmpty().WithMessage("GymHouseId is required.");

        RuleFor(x => x.ClassName)
            .NotEmpty().WithMessage("ClassName is required.")
            .MaximumLength(200).WithMessage("ClassName must not exceed 200 characters.");

        RuleFor(x => x.MaxCapacity)
            .GreaterThan(0).WithMessage("MaxCapacity must be greater than 0.");

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime).WithMessage("EndTime must be after StartTime.");
    }
}
