using CSharpFunctionalExtensions;
using GymManager.Application.Subscriptions.Shared;
using MediatR;

namespace GymManager.Application.Subscriptions.GetSubscriptionsByMember;

public sealed record GetSubscriptionsByMemberQuery(
    Guid MemberId,
    Guid GymHouseId) : IRequest<Result<List<SubscriptionDto>>>;
