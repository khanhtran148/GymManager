using FluentValidation;

namespace GymManager.Application.Invitations.AcceptInvitation;

public sealed class AcceptInvitationValidator : AbstractValidator<AcceptInvitationCommand>
{
    public AcceptInvitationValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("Invitation token is required.");

        // Password and FullName are only required for new users;
        // validation of the new-user case is enforced in the handler
        // once we know whether a user already exists.
        When(x => x.Password is not null, () =>
        {
            RuleFor(x => x.Password!)
                .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
                .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
                .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
                .Matches("[0-9]").WithMessage("Password must contain at least one digit.")
                .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");
        });

        When(x => x.FullName is not null, () =>
        {
            RuleFor(x => x.FullName!)
                .MaximumLength(200).WithMessage("Full name must not exceed 200 characters.");
        });
    }
}
