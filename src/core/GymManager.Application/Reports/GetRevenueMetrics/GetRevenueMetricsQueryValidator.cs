using FluentValidation;

namespace GymManager.Application.Reports.GetRevenueMetrics;

public sealed class GetRevenueMetricsQueryValidator : AbstractValidator<GetRevenueMetricsQuery>
{
    public GetRevenueMetricsQueryValidator()
    {
        RuleFor(x => x.GymHouseId).NotEmpty().WithMessage("GymHouseId is required.");
        RuleFor(x => x.From).NotEmpty().WithMessage("From date is required.");
        RuleFor(x => x.To).NotEmpty().WithMessage("To date is required.")
            .GreaterThan(x => x.From).WithMessage("To date must be after From date.");
        RuleFor(x => x)
            .Must(x => (x.To - x.From).TotalDays <= 366)
            .WithMessage("Date range must not exceed 366 days.");
    }
}
