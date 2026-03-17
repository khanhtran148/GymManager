using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
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
        if (request.UserId != currentUser.UserId)
            return Result.Failure(new ForbiddenError().ToString());

        foreach (var item in request.Preferences)
        {
            await preferenceRepository.UpsertAsync(request.UserId, item.Channel, item.IsEnabled, ct);
        }

        return Result.Success();
    }
}
