using CSharpFunctionalExtensions;
using GymManager.Application.Auth.Shared;
using GymManager.Application.Common.Constants;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Roles.Shared;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Auth.Register;

public sealed class RegisterCommandHandler(
    IUserRepository userRepository,
    IGymHouseRepository gymHouseRepository,
    IMemberRepository memberRepository,
    IRolePermissionRepository rolePermissionRepository,
    IPasswordHasher passwordHasher,
    ITokenService tokenService)
    : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var existing = await userRepository.GetByEmailAsync(request.Email, ct);
        if (existing is not null)
            return Result.Failure<AuthResponse>(new ConflictError("Email is already registered.").ToString());

        // Public self-registration: any caller may register as a member of any gym house by
        // supplying its ID. This is intentional — GymManager is a SaaS platform where gym
        // discovery and self-signup is a core feature. If the team later needs enrollment
        // control (e.g., invite-only gyms), add a GymHouse.AllowPublicRegistration flag
        // and check it here before proceeding.
        var gymHouse = await gymHouseRepository.GetByIdAsync(request.GymHouseId, ct);
        if (gymHouse is null)
            return Result.Failure<AuthResponse>(
                new NotFoundError("GymHouse", request.GymHouseId).ToString());

        var permissionsAlreadySeeded = await rolePermissionRepository.ExistsForTenantAsync(gymHouse.OwnerId, ct);
        if (!permissionsAlreadySeeded)
        {
            var defaults = RolePermissionDefaults.GetDefaultRolePermissions(gymHouse.OwnerId);
            await rolePermissionRepository.UpsertRangeAsync(defaults, ct);
        }

        var passwordHash = passwordHasher.Hash(request.Password);

#pragma warning disable CS0618
        var user = new User
        {
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = passwordHash,
            FullName = request.FullName,
            Phone = request.Phone,
            Role = Role.Member,
            Permissions = RolePermissionDefaults.GetDefaultPermissions(Role.Member)
        };
#pragma warning restore CS0618

        var sequence = await memberRepository.GetNextSequenceAsync(gymHouse.Id, ct);
        var memberCode = Member.GenerateMemberCode(
            gymHouse.Name.Length >= 2 ? gymHouse.Name[..2].ToUpperInvariant() : "GM",
            sequence);

        var member = new Member
        {
            UserId = user.Id,
            GymHouseId = gymHouse.Id,
            MemberCode = memberCode
        };

        // Persist user and member BEFORE generating access token so that
        // JwtTokenService.ResolveTenantIdAsync can find the member association
        // and embed the correct tenant_id claim in the JWT.
        await userRepository.CreateAsync(user, ct);
        await memberRepository.CreateAsync(member, ct);

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
