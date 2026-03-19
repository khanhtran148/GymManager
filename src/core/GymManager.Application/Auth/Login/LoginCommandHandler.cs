using CSharpFunctionalExtensions;
using GymManager.Application.Auth.Shared;
using GymManager.Application.Common.Constants;
using GymManager.Application.Common.Interfaces;
using MediatR;

namespace GymManager.Application.Auth.Login;

public sealed class LoginCommandHandler(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ITokenService tokenService)
    : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await userRepository.GetByEmailAsync(request.Email.ToLowerInvariant(), ct);
        if (user is null)
            return Result.Failure<AuthResponse>("Invalid credentials.");

        if (!passwordHasher.Verify(request.Password, user.PasswordHash))
            return Result.Failure<AuthResponse>("Invalid credentials.");

        var accessToken = await tokenService.GenerateAccessTokenAsync(user, ct);
        var refreshToken = tokenService.GenerateRefreshToken();
        user.SetRefreshToken(refreshToken, DateTime.UtcNow.AddDays(TokenDefaults.RefreshTokenExpiryDays));

        await userRepository.UpdateAsync(user, ct);

        return Result.Success(new AuthResponse(
            user.Id,
            user.Email,
            user.FullName,
            accessToken,
            refreshToken,
            DateTime.UtcNow.AddMinutes(TokenDefaults.AccessTokenExpiryMinutes)));
    }
}
