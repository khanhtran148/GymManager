using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Subscriptions.CreateSubscription;
using GymManager.Application.Subscriptions.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Subscriptions.FreezeSubscription;

public sealed class FreezeSubscriptionCommandHandler(
    ISubscriptionRepository subscriptionRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<FreezeSubscriptionCommand, Result<SubscriptionDto>>
{
    public async Task<Result<SubscriptionDto>> Handle(FreezeSubscriptionCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageSubscriptions, ct);
        if (!canManage)
            return Result.Failure<SubscriptionDto>(new ForbiddenError().ToString());

        var subscription = await subscriptionRepository.GetByIdAsync(request.Id, ct);
        if (subscription is null)
            return Result.Failure<SubscriptionDto>(new NotFoundError("Subscription", request.Id).ToString());

        var freezeResult = subscription.Freeze(request.FrozenUntil);
        if (freezeResult.IsFailure)
            return Result.Failure<SubscriptionDto>(freezeResult.Error);

        await subscriptionRepository.UpdateAsync(subscription, ct);

        return Result.Success(CreateSubscriptionCommandHandler.ToDto(subscription));
    }
}
