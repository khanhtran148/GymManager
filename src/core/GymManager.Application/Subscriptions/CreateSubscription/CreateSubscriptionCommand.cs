using CSharpFunctionalExtensions;
using GymManager.Application.Subscriptions.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Subscriptions.CreateSubscription;

public sealed record CreateSubscriptionCommand(
    Guid MemberId,
    Guid GymHouseId,
    SubscriptionType Type,
    decimal Price,
    DateTime StartDate,
    DateTime EndDate) : IRequest<Result<SubscriptionDto>>;
