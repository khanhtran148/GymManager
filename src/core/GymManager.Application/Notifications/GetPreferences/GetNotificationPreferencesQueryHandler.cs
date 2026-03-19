using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Notifications.Shared;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Notifications.GetPreferences;

public sealed class GetNotificationPreferencesQueryHandler(
    INotificationPreferenceRepository preferenceRepository,
    ICurrentUser currentUser)
    : IRequestHandler<GetNotificationPreferencesQuery, Result<List<NotificationPreferenceDto>>>
{
    private static readonly IReadOnlyList<NotificationChannel> AllChannels =
        [NotificationChannel.InApp, NotificationChannel.Push, NotificationChannel.Email];

    public async Task<Result<List<NotificationPreferenceDto>>> Handle(
        GetNotificationPreferencesQuery request, CancellationToken ct)
    {
        var saved = await preferenceRepository.GetByUserIdAsync(currentUser.UserId, ct);

        var result = AllChannels.Select(channel =>
        {
            var pref = saved.FirstOrDefault(p => p.Channel == channel);
            return new NotificationPreferenceDto(channel, pref?.IsEnabled ?? true);
        }).ToList();

        return Result.Success(result);
    }
}
