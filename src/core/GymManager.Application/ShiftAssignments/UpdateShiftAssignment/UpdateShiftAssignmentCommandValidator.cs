using FluentValidation;

namespace GymManager.Application.ShiftAssignments.UpdateShiftAssignment;

public sealed class UpdateShiftAssignmentCommandValidator : AbstractValidator<UpdateShiftAssignmentCommand>
{
    public UpdateShiftAssignmentCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.GymHouseId).NotEmpty();
        RuleFor(x => x.ShiftDate).NotEmpty();
        RuleFor(x => x.StartTime).NotEmpty();
        RuleFor(x => x.EndTime).NotEmpty()
            .Must((cmd, endTime) => endTime > cmd.StartTime)
            .WithMessage("EndTime must be after StartTime.");
    }
}
