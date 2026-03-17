using FluentValidation;

namespace GymManager.Application.ShiftAssignments.GetShiftAssignments;

public sealed class GetShiftAssignmentsQueryValidator : AbstractValidator<GetShiftAssignmentsQuery>
{
    public GetShiftAssignmentsQueryValidator()
    {
        RuleFor(x => x.GymHouseId).NotEmpty();
    }
}
