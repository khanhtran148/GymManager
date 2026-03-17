using FluentValidation;

namespace GymManager.Application.Staff.UpdateStaff;

public sealed class UpdateStaffCommandValidator : AbstractValidator<UpdateStaffCommand>
{
    public UpdateStaffCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.GymHouseId).NotEmpty();
        RuleFor(x => x.BaseSalary).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PerClassBonus).GreaterThanOrEqualTo(0);
    }
}
