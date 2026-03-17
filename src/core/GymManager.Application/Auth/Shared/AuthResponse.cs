namespace GymManager.Application.Auth.Shared;

public sealed record AuthResponse(
    Guid UserId,
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt);
