using FluentValidation;
using GymManager.Domain.Enums;

namespace GymManager.Application.Roles.ChangeUserRole;

public sealed class ChangeUserRoleCommandValidator : AbstractValidator<ChangeUserRoleCommand>
{
    public ChangeUserRoleCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId is required.");

        RuleFor(x => x.Role)
            .Must(r => r != Role.Owner)
            .WithMessage("Cannot assign Owner role to a user.");
    }
}
