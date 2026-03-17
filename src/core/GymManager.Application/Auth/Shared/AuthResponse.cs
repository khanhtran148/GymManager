namespace GymManager.Application.Auth.Shared;

public sealed record AuthResponse(
    Guid UserId,
    string Email,
    string FullName,
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt);
