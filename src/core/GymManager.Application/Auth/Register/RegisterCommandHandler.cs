using CSharpFunctionalExtensions;
using GymManager.Application.Auth.Shared;
using GymManager.Application.Common.Constants;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Auth.Register;

public sealed class RegisterCommandHandler(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ITokenService tokenService)
    : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var existing = await userRepository.GetByEmailAsync(request.Email, ct);
        if (existing is not null)
            return Result.Failure<AuthResponse>(new ConflictError("Email is already registered.").ToString());

        var passwordHash = passwordHasher.Hash(request.Password);

#pragma warning disable CS0618 // Permissions kept in sync during migration period; JwtTokenService reads from role_permissions
        var user = new User
        {
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = passwordHash,
            FullName = request.FullName,
            Phone = request.Phone,
            Role = Role.Owner,
            Permissions = Permission.Admin
        };
#pragma warning restore CS0618

        var accessToken = await tokenService.GenerateAccessTokenAsync(user, ct);
        var refreshToken = tokenService.GenerateRefreshToken();
        user.SetRefreshToken(refreshToken, DateTime.UtcNow.AddDays(TokenDefaults.RefreshTokenExpiryDays));

        await userRepository.CreateAsync(user, ct);

        return Result.Success(new AuthResponse(
            user.Id,
            user.Email,
            user.FullName,
            accessToken,
            refreshToken,
            DateTime.UtcNow.AddMinutes(TokenDefaults.AccessTokenExpiryMinutes)));
    }
}
