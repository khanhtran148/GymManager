using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Builders;

public sealed class TransactionBuilder
{
    private Guid _gymHouseId = Guid.NewGuid();
    private TransactionType _transactionType = TransactionType.MembershipFee;
    private TransactionDirection _direction = TransactionDirection.Credit;
    private decimal _amount = 100m;
    private TransactionCategory _category = TransactionCategory.Revenue;
    private string _description = "Test transaction";
    private DateTime _transactionDate = DateTime.UtcNow;
    private Guid? _relatedEntityId = null;
    private Guid? _approvedById = null;
    private PaymentMethod? _paymentMethod = null;
    private string? _externalReference = null;

    public TransactionBuilder WithGymHouseId(Guid id) { _gymHouseId = id; return this; }
    public TransactionBuilder WithType(TransactionType type) { _transactionType = type; return this; }
    public TransactionBuilder WithDirection(TransactionDirection direction) { _direction = direction; return this; }
    public TransactionBuilder WithAmount(decimal amount) { _amount = amount; return this; }
    public TransactionBuilder WithCategory(TransactionCategory category) { _category = category; return this; }
    public TransactionBuilder WithDescription(string description) { _description = description; return this; }
    public TransactionBuilder WithTransactionDate(DateTime date) { _transactionDate = date; return this; }
    public TransactionBuilder WithRelatedEntityId(Guid id) { _relatedEntityId = id; return this; }
    public TransactionBuilder WithApprovedById(Guid id) { _approvedById = id; return this; }
    public TransactionBuilder WithPaymentMethod(PaymentMethod method) { _paymentMethod = method; return this; }
    public TransactionBuilder WithExternalReference(string reference) { _externalReference = reference; return this; }

    public Transaction Build() => new()
    {
        GymHouseId = _gymHouseId,
        TransactionType = _transactionType,
        Direction = _direction,
        Amount = _amount,
        Category = _category,
        Description = _description,
        TransactionDate = _transactionDate,
        RelatedEntityId = _relatedEntityId,
        ApprovedById = _approvedById,
        PaymentMethod = _paymentMethod,
        ExternalReference = _externalReference
    };
}
