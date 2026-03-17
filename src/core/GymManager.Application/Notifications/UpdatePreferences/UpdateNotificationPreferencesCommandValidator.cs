using FluentValidation;

namespace GymManager.Application.Notifications.UpdatePreferences;

public sealed class UpdateNotificationPreferencesCommandValidator
    : AbstractValidator<UpdateNotificationPreferencesCommand>
{
    public UpdateNotificationPreferencesCommandValidator()
    {
        RuleFor(x => x.Preferences)
            .NotNull().WithMessage("Preferences list is required.")
            .NotEmpty().WithMessage("Preferences list must not be empty.");

        RuleForEach(x => x.Preferences)
            .ChildRules(pref =>
            {
                pref.RuleFor(p => p.Channel)
                    .IsInEnum().WithMessage("Channel must be a valid value.");
            });
    }
}
