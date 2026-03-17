using GymManager.Domain.Entities;
using GymManager.Domain.Enums;

namespace GymManager.Tests.Common.Builders;

public sealed class NotificationPreferenceBuilder
{
    private Guid _userId = Guid.NewGuid();
    private NotificationChannel _channel = NotificationChannel.InApp;
    private bool _isEnabled = true;

    public NotificationPreferenceBuilder WithUserId(Guid userId) { _userId = userId; return this; }
    public NotificationPreferenceBuilder WithChannel(NotificationChannel channel) { _channel = channel; return this; }
    public NotificationPreferenceBuilder Enabled() { _isEnabled = true; return this; }
    public NotificationPreferenceBuilder Disabled() { _isEnabled = false; return this; }

    public NotificationPreference Build() => new()
    {
        UserId = _userId,
        Channel = _channel,
        IsEnabled = _isEnabled
    };
}
