using FluentValidation;

namespace GymManager.Application.ShiftAssignments.CreateShiftAssignment;

public sealed class CreateShiftAssignmentCommandValidator : AbstractValidator<CreateShiftAssignmentCommand>
{
    public CreateShiftAssignmentCommandValidator()
    {
        RuleFor(x => x.StaffId).NotEmpty();
        RuleFor(x => x.GymHouseId).NotEmpty();
        RuleFor(x => x.ShiftDate).NotEmpty();
        RuleFor(x => x.StartTime).NotEmpty();
        RuleFor(x => x.EndTime).NotEmpty()
            .Must((cmd, endTime) => endTime > cmd.StartTime)
            .WithMessage("EndTime must be after StartTime.");
    }
}
