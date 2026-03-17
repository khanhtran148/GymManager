using FluentValidation;

namespace GymManager.Application.Bookings.CheckIn;

public sealed class CheckInCommandValidator : AbstractValidator<CheckInCommand>
{
    public CheckInCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.GymHouseId).NotEmpty();
        RuleFor(x => x.Source).IsInEnum();
    }
}
