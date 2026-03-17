using FluentValidation;

namespace GymManager.Application.Bookings.MarkNoShow;

public sealed class MarkNoShowCommandValidator : AbstractValidator<MarkNoShowCommand>
{
    public MarkNoShowCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.GymHouseId).NotEmpty();
    }
}
