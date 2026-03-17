using GymManager.Application.Common.Interfaces;

namespace GymManager.Tests.Common.Fakes;

public sealed class FakeNotificationHub : INotificationHub
{
    public List<(string Group, string Method, object Payload)> SentMessages { get; } = [];

    public Task SendToGroupAsync(string groupName, string method, object payload, CancellationToken ct = default)
    {
        SentMessages.Add((groupName, method, payload));
        return Task.CompletedTask;
    }
}
