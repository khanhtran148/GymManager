using CSharpFunctionalExtensions;
using GymManager.Application.Subscriptions.Shared;
using MediatR;

namespace GymManager.Application.Subscriptions.CancelSubscription;

public sealed record CancelSubscriptionCommand(Guid Id, Guid GymHouseId) : IRequest<Result<SubscriptionDto>>;
