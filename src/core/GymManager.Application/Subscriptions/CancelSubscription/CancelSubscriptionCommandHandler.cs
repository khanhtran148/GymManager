using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Subscriptions.Shared;
using GymManager.Domain.Enums;
using Mapster;
using MediatR;

namespace GymManager.Application.Subscriptions.CancelSubscription;

public sealed class CancelSubscriptionCommandHandler(
    ISubscriptionRepository subscriptionRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<CancelSubscriptionCommand, Result<SubscriptionDto>>
{
    public async Task<Result<SubscriptionDto>> Handle(CancelSubscriptionCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageSubscriptions, ct);
        if (!canManage)
            return Result.Failure<SubscriptionDto>(new ForbiddenError().ToString());

        var subscription = await subscriptionRepository.GetByIdAsync(request.Id, ct);
        if (subscription is null)
            return Result.Failure<SubscriptionDto>(new NotFoundError("Subscription", request.Id).ToString());

        var cancelResult = subscription.Cancel();
        if (cancelResult.IsFailure)
            return Result.Failure<SubscriptionDto>(cancelResult.Error);

        await subscriptionRepository.UpdateAsync(subscription, ct);

        return Result.Success(subscription.Adapt<SubscriptionDto>());
    }
}
