using FluentValidation;

namespace GymManager.Application.GymHouses.CreateGymHouse;

public sealed class CreateGymHouseCommandValidator : AbstractValidator<CreateGymHouseCommand>
{
    public CreateGymHouseCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Address is required.")
            .MaximumLength(500).WithMessage("Address must not exceed 500 characters.");

        RuleFor(x => x.HourlyCapacity)
            .GreaterThanOrEqualTo(0).WithMessage("Hourly capacity must be non-negative.");
    }
}
