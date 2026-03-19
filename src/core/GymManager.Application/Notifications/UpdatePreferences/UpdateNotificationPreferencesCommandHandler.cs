using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using MediatR;

namespace GymManager.Application.Notifications.UpdatePreferences;

public sealed class UpdateNotificationPreferencesCommandHandler(
    INotificationPreferenceRepository preferenceRepository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateNotificationPreferencesCommand, Result>
{
    public async Task<Result> Handle(
        UpdateNotificationPreferencesCommand request, CancellationToken ct)
    {
        foreach (var item in request.Preferences)
        {
            await preferenceRepository.UpsertAsync(currentUser.UserId, item.Channel, item.IsEnabled, ct);
        }

        return Result.Success();
    }
}
