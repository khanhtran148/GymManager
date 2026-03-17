using CSharpFunctionalExtensions;
using GymManager.Application.Auth.Shared;
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

        var accessToken = tokenService.GenerateAccessToken(user);
        var refreshToken = tokenService.GenerateRefreshToken();
        user.SetRefreshToken(refreshToken, DateTime.UtcNow.AddDays(7));

        await userRepository.UpdateAsync(user, ct);

        return Result.Success(new AuthResponse(
            user.Id,
            accessToken,
            refreshToken,
            DateTime.UtcNow.AddMinutes(15)));
    }
}
