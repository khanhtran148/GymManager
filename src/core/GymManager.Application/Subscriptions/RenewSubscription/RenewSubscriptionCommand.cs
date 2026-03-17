using CSharpFunctionalExtensions;
using GymManager.Application.Subscriptions.Shared;
using MediatR;

namespace GymManager.Application.Subscriptions.RenewSubscription;

public sealed record RenewSubscriptionCommand(
    Guid Id,
    Guid GymHouseId,
    DateTime StartDate,
    DateTime EndDate,
    decimal Price) : IRequest<Result<SubscriptionDto>>;
