using FluentValidation;

namespace GymManager.Application.Payroll.GetPayrollPeriods;

public sealed class GetPayrollPeriodsQueryValidator : AbstractValidator<GetPayrollPeriodsQuery>
{
    public GetPayrollPeriodsQueryValidator()
    {
        RuleFor(x => x.GymHouseId).NotEmpty();
        RuleFor(x => x.Page).GreaterThan(0);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}
