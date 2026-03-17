using FluentValidation;

namespace GymManager.Application.Staff.GetStaff;

public sealed class GetStaffQueryValidator : AbstractValidator<GetStaffQuery>
{
    public GetStaffQueryValidator()
    {
        RuleFor(x => x.GymHouseId).NotEmpty();
        RuleFor(x => x.Page).GreaterThan(0);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}
