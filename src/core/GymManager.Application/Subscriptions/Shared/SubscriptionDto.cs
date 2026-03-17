using GymManager.Domain.Enums;

namespace GymManager.Application.Subscriptions.Shared;

public sealed record SubscriptionDto(
    Guid Id,
    Guid MemberId,
    Guid GymHouseId,
    SubscriptionType Type,
    SubscriptionStatus Status,
    decimal Price,
    DateTime StartDate,
    DateTime EndDate,
    DateTime? FrozenAt,
    DateTime? FrozenUntil,
    DateTime CreatedAt);
