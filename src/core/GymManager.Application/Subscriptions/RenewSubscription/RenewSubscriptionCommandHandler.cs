using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Subscriptions.Shared;
using GymManager.Domain.Enums;
using Mapster;
using MediatR;

namespace GymManager.Application.Subscriptions.RenewSubscription;

public sealed class RenewSubscriptionCommandHandler(
    ISubscriptionRepository subscriptionRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<RenewSubscriptionCommand, Result<SubscriptionDto>>
{
    public async Task<Result<SubscriptionDto>> Handle(RenewSubscriptionCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageSubscriptions, ct);
        if (!canManage)
            return Result.Failure<SubscriptionDto>(new ForbiddenError().ToString());

        var subscription = await subscriptionRepository.GetByIdAsync(request.Id, ct);
        if (subscription is null)
            return Result.Failure<SubscriptionDto>(new NotFoundError("Subscription", request.Id).ToString());

        var renewResult = subscription.Renew(request.StartDate, request.EndDate, request.Price);
        if (renewResult.IsFailure)
            return Result.Failure<SubscriptionDto>(renewResult.Error);

        await subscriptionRepository.UpdateAsync(subscription, ct);

        return Result.Success(subscription.Adapt<SubscriptionDto>());
    }
}
