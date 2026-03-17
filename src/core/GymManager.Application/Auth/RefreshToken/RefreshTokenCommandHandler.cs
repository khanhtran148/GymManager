using CSharpFunctionalExtensions;
using GymManager.Application.Auth.Shared;
using GymManager.Application.Common.Interfaces;
using MediatR;
using System.Security.Claims;

namespace GymManager.Application.Auth.RefreshToken;

public sealed class RefreshTokenCommandHandler(
    IUserRepository userRepository,
    ITokenService tokenService)
    : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        ClaimsPrincipal? principal = null;
        try
        {
            principal = tokenService.GetPrincipalFromExpiredToken(request.AccessToken);
        }
        catch
        {
            // swallow — will return failure below
        }

        Guid userId = Guid.Empty;
        if (principal is not null)
        {
            var sub = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? principal.FindFirst("sub")?.Value;
            Guid.TryParse(sub, out userId);
        }

        if (userId == Guid.Empty)
            return Result.Failure<AuthResponse>("Invalid refresh token.");

        var user = await userRepository.GetByIdAsync(userId, ct);
        if (user is null || !user.IsRefreshTokenValid(request.RefreshToken))
            return Result.Failure<AuthResponse>("Invalid or expired refresh token.");

        var newAccessToken = tokenService.GenerateAccessToken(user);
        var newRefreshToken = tokenService.GenerateRefreshToken();
        user.SetRefreshToken(newRefreshToken, DateTime.UtcNow.AddDays(7));

        await userRepository.UpdateAsync(user, ct);

        return Result.Success(new AuthResponse(
            user.Id,
            user.Email,
            user.FullName,
            newAccessToken,
            newRefreshToken,
            DateTime.UtcNow.AddMinutes(15)));
    }
}
