using FluentValidation;

namespace GymManager.Application.Transactions.RecordTransaction;

public sealed class RecordTransactionCommandValidator : AbstractValidator<RecordTransactionCommand>
{
    public RecordTransactionCommandValidator()
    {
        RuleFor(x => x.GymHouseId).NotEmpty().WithMessage("GymHouseId is required.");
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Amount must be greater than zero.");
        RuleFor(x => x.Description).NotEmpty().WithMessage("Description is required.")
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters.");
        RuleFor(x => x.TransactionDate).NotEmpty().WithMessage("TransactionDate is required.");
    }
}
