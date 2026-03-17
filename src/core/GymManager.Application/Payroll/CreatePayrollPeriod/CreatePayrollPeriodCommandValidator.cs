using FluentValidation;

namespace GymManager.Application.Payroll.CreatePayrollPeriod;

public sealed class CreatePayrollPeriodCommandValidator : AbstractValidator<CreatePayrollPeriodCommand>
{
    public CreatePayrollPeriodCommandValidator()
    {
        RuleFor(x => x.GymHouseId).NotEmpty();
        RuleFor(x => x.PeriodStart).NotEmpty();
        RuleFor(x => x.PeriodEnd).NotEmpty()
            .Must((cmd, periodEnd) => periodEnd > cmd.PeriodStart)
            .WithMessage("PeriodEnd must be after PeriodStart.");
    }
}
