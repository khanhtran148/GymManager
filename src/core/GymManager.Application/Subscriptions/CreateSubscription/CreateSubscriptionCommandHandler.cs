using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Subscriptions.Shared;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using MediatR;

namespace GymManager.Application.Subscriptions.CreateSubscription;

public sealed class CreateSubscriptionCommandHandler(
    ISubscriptionRepository subscriptionRepository,
    IMemberRepository memberRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser,
    IPublisher publisher)
    : IRequestHandler<CreateSubscriptionCommand, Result<SubscriptionDto>>
{
    public async Task<Result<SubscriptionDto>> Handle(CreateSubscriptionCommand request, CancellationToken ct)
    {
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, request.GymHouseId, Permission.ManageSubscriptions, ct);
        if (!canManage)
            return Result.Failure<SubscriptionDto>(new ForbiddenError().ToString());

        var member = await memberRepository.GetByIdAsync(request.MemberId, ct);
        if (member is null)
            return Result.Failure<SubscriptionDto>(new NotFoundError("Member", request.MemberId).ToString());

        var activeSub = await subscriptionRepository.GetActiveByMemberIdAsync(request.MemberId, ct);
        if (activeSub is not null)
            return Result.Failure<SubscriptionDto>(
                new ConflictError("Member already has an active subscription.").ToString());

        var subscription = new Subscription
        {
            MemberId = request.MemberId,
            GymHouseId = request.GymHouseId,
            Type = request.Type,
            Price = request.Price,
            StartDate = request.StartDate,
            EndDate = request.EndDate
        };

        await subscriptionRepository.CreateAsync(subscription, ct);

        await publisher.Publish(new SubscriptionCreatedEvent(
            subscription.Id, request.MemberId, request.GymHouseId, request.Price), ct);

        return Result.Success(ToDto(subscription));
    }

    internal static SubscriptionDto ToDto(Subscription s) => new(
        s.Id,
        s.MemberId,
        s.GymHouseId,
        s.Type,
        s.Status,
        s.Price,
        s.StartDate,
        s.EndDate,
        s.FrozenAt,
        s.FrozenUntil,
        s.CreatedAt);
}
