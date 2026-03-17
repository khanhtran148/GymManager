using FluentValidation;

namespace GymManager.Application.Subscriptions.CreateSubscription;

public sealed class CreateSubscriptionCommandValidator : AbstractValidator<CreateSubscriptionCommand>
{
    public CreateSubscriptionCommandValidator()
    {
        RuleFor(x => x.MemberId).NotEmpty().WithMessage("MemberId is required.");
        RuleFor(x => x.GymHouseId).NotEmpty().WithMessage("GymHouseId is required.");
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).WithMessage("Price must be non-negative.");
        RuleFor(x => x.StartDate).NotEmpty().WithMessage("StartDate is required.");
        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("EndDate is required.")
            .GreaterThan(x => x.StartDate).WithMessage("EndDate must be after StartDate.");
    }
}
