using CSharpFunctionalExtensions;
using GymManager.Application.Subscriptions.Shared;
using MediatR;

namespace GymManager.Application.Subscriptions.FreezeSubscription;

public sealed record FreezeSubscriptionCommand(
    Guid Id,
    Guid GymHouseId,
    DateTime FrozenUntil) : IRequest<Result<SubscriptionDto>>;
