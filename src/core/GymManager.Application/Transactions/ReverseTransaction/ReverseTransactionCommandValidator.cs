using FluentValidation;

namespace GymManager.Application.Transactions.ReverseTransaction;

public sealed class ReverseTransactionCommandValidator : AbstractValidator<ReverseTransactionCommand>
{
    public ReverseTransactionCommandValidator()
    {
        RuleFor(x => x.GymHouseId).NotEmpty().WithMessage("GymHouseId is required.");
        RuleFor(x => x.TransactionId).NotEmpty().WithMessage("TransactionId is required.");
        RuleFor(x => x.Reason).NotEmpty().WithMessage("Reason is required.")
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters.");
    }
}
