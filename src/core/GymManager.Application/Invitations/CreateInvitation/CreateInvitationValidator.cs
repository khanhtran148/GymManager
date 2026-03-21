using FluentValidation;
using GymManager.Domain.Enums;

namespace GymManager.Application.Invitations.CreateInvitation;

public sealed class CreateInvitationValidator : AbstractValidator<CreateInvitationCommand>
{
    public CreateInvitationValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email must be a valid email address.");

        RuleFor(x => x.Role)
            .NotEqual(Role.Owner).WithMessage("Cannot send an invitation for the Owner role.")
            .IsInEnum().WithMessage("Role must be a valid role value.");

        RuleFor(x => x.GymHouseId)
            .NotEmpty().WithMessage("Gym house is required.");
    }
}
