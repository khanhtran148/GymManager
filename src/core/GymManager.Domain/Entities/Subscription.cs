using CSharpFunctionalExtensions;
using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Entities;

public sealed class Subscription : AuditableEntity
{
    public Guid MemberId { get; set; }
    public Guid GymHouseId { get; set; }
    public SubscriptionType Type { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
    public decimal Price { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime? FrozenAt { get; set; }
    public DateTime? FrozenUntil { get; set; }
    public Member Member { get; set; } = null!;

    public Result Freeze(DateTime until)
    {
        if (Status != SubscriptionStatus.Active)
            return Result.Failure("Only active subscriptions can be frozen.");

        Status = SubscriptionStatus.Frozen;
        FrozenAt = DateTime.UtcNow;
        FrozenUntil = until;
        return Result.Success();
    }

    public Result Cancel()
    {
        if (Status == SubscriptionStatus.Cancelled)
            return Result.Failure("Subscription is already cancelled.");

        Status = SubscriptionStatus.Cancelled;
        return Result.Success();
    }

    public Result Expire()
    {
        if (Status != SubscriptionStatus.Active && Status != SubscriptionStatus.Frozen)
            return Result.Failure("Only active or frozen subscriptions can expire.");

        Status = SubscriptionStatus.Expired;
        return Result.Success();
    }

    public Result Renew(DateTime newStartDate, DateTime newEndDate, decimal newPrice)
    {
        if (newEndDate <= newStartDate)
            return Result.Failure("End date must be after start date.");

        Status = SubscriptionStatus.Active;
        StartDate = newStartDate;
        EndDate = newEndDate;
        Price = newPrice;
        FrozenAt = null;
        FrozenUntil = null;
        return Result.Success();
    }
}
