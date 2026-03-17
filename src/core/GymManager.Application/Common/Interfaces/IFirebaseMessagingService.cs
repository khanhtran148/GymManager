namespace GymManager.Application.Common.Interfaces;

public interface IFirebaseMessagingService
{
    Task SendMulticastAsync(IEnumerable<string> deviceTokens, string title, string body, CancellationToken ct = default);
}
