using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;

namespace GymManager.BackgroundServices.Consumers;

public static class RecipientResolver
{
    public static Task<List<User>> ResolveAsync(
        IUserRepository userRepository,
        AnnouncementPublishedEvent evt,
        CancellationToken ct) =>
        evt.Audience switch
        {
            TargetAudience.Everyone or TargetAudience.AllMembers or TargetAudience.ActiveMembers =>
                userRepository.GetByRoleAndHouseAsync(Role.Member, evt.GymHouseId, ct),
            TargetAudience.Staff =>
                userRepository.GetByRoleAndHouseAsync(Role.Staff, evt.GymHouseId, ct),
            TargetAudience.Trainers =>
                userRepository.GetByRoleAndHouseAsync(Role.Trainer, evt.GymHouseId, ct),
            _ => Task.FromResult(new List<User>())
        };
}
