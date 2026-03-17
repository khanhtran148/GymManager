namespace GymManager.Application.Common.Interfaces;

public interface INotificationHub
{
    Task SendToGroupAsync(string groupName, string method, object payload, CancellationToken ct = default);
}
