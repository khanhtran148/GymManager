using FluentValidation;

namespace GymManager.Application.Staff.CreateStaff;

public sealed class CreateStaffCommandValidator : AbstractValidator<CreateStaffCommand>
{
    public CreateStaffCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.GymHouseId).NotEmpty();
        RuleFor(x => x.BaseSalary).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PerClassBonus).GreaterThanOrEqualTo(0);
    }
}
