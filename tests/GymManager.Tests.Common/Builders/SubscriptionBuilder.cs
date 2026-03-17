using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Builders;

public sealed class SubscriptionBuilder
{
    private Guid _memberId = Guid.NewGuid();
    private Guid _gymHouseId = Guid.NewGuid();
    private SubscriptionType _type = SubscriptionType.Monthly;
    private SubscriptionStatus _status = SubscriptionStatus.Active;
    private decimal _price = 100m;
    private DateTime _startDate = DateTime.UtcNow;
    private DateTime _endDate = DateTime.UtcNow.AddMonths(1);

    public SubscriptionBuilder WithMemberId(Guid memberId) { _memberId = memberId; return this; }
    public SubscriptionBuilder WithGymHouseId(Guid gymHouseId) { _gymHouseId = gymHouseId; return this; }
    public SubscriptionBuilder WithType(SubscriptionType type) { _type = type; return this; }
    public SubscriptionBuilder WithStatus(SubscriptionStatus status) { _status = status; return this; }
    public SubscriptionBuilder WithPrice(decimal price) { _price = price; return this; }
    public SubscriptionBuilder WithStartDate(DateTime date) { _startDate = date; return this; }
    public SubscriptionBuilder WithEndDate(DateTime date) { _endDate = date; return this; }

    public Subscription Build() => new()
    {
        MemberId = _memberId,
        GymHouseId = _gymHouseId,
        Type = _type,
        Status = _status,
        Price = _price,
        StartDate = _startDate,
        EndDate = _endDate
    };
}
