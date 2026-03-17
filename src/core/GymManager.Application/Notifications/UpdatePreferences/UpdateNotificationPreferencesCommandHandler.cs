using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using MediatR;

namespace GymManager.Application.Notifications.UpdatePreferences;

public sealed class UpdateNotificationPreferencesCommandHandler(
    INotificationPreferenceRepository preferenceRepository)
    : IRequestHandler<UpdateNotificationPreferencesCommand, Result>
{
    public async Task<Result> Handle(
        UpdateNotificationPreferencesCommand request, CancellationToken ct)
    {
        foreach (var item in request.Preferences)
        {
            await preferenceRepository.UpsertAsync(request.UserId, item.Channel, item.IsEnabled, ct);
        }

        return Result.Success();
    }
}
