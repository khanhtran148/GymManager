using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Subscriptions.CreateSubscription;
using GymManager.Application.Subscriptions.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Subscriptions.GetSubscriptionsByMember;

public sealed class GetSubscriptionsByMemberQueryHandler(
    ISubscriptionRepository subscriptionRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser)
    : IRequestHandler<GetSubscriptionsByMemberQuery, Result<List<SubscriptionDto>>>
{
    public async Task<Result<List<SubscriptionDto>>> Handle(
        GetSubscriptionsByMemberQuery request, CancellationToken ct)
    {
        var canView = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ViewSubscriptions, ct);
        if (!canView)
            return Result.Failure<List<SubscriptionDto>>(new ForbiddenError().ToString());

        var subs = await subscriptionRepository.GetByMemberIdAsync(request.MemberId, ct);

        return Result.Success(subs.Select(CreateSubscriptionCommandHandler.ToDto).ToList());
    }
}
