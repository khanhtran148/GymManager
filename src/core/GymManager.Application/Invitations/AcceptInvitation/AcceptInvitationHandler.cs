using CSharpFunctionalExtensions;
using GymManager.Application.Auth.Shared;
using GymManager.Application.Common.Constants;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Roles.Shared;
using GymManager.Domain.Enums;
using MediatR;
using Invitation = GymManager.Domain.Entities.Invitation;
using Member = GymManager.Domain.Entities.Member;
using StaffEntity = GymManager.Domain.Entities.Staff;
using User = GymManager.Domain.Entities.User;

namespace GymManager.Application.Invitations.AcceptInvitation;

public sealed class AcceptInvitationHandler(
    IInvitationRepository invitationRepository,
    IUserRepository userRepository,
    IMemberRepository memberRepository,
    IStaffRepository staffRepository,
    IRolePermissionRepository rolePermissionRepository,
    IPasswordHasher passwordHasher,
    ITokenService tokenService)
    : IRequestHandler<AcceptInvitationCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(
        AcceptInvitationCommand request, CancellationToken ct)
    {
        // 1. Atomically mark the invitation as accepted (Fix #1: eliminates TOCTOU race).
        //    AcceptByTokenAsync performs a single UPDATE WHERE accepted_at IS NULL AND expires_at > now.
        //    If another request accepted the same token concurrently, this returns null.
        var invitation = await invitationRepository.AcceptByTokenAsync(request.Token, ct);

        if (invitation is null)
        {
            // Determine the precise failure reason via a secondary no-tracking read so we
            // can return a useful error message to the caller.
            var secondary = await invitationRepository.GetByTokenAsync(request.Token, ct);

            if (secondary is null)
                return Result.Failure<AuthResponse>(new NotFoundError("Invitation", request.Token).ToString());

            if (secondary.IsAccepted)
                return Result.Failure<AuthResponse>("This invitation has already been accepted.");

            // Only remaining case: expired (accepted_at IS NULL but expires_at <= now)
            return Result.Failure<AuthResponse>("This invitation link has expired.");
        }

        // 2. Check if user exists by email
        var existingUser = await userRepository.GetByEmailAsync(invitation.Email, ct);

        User user;
        if (existingUser is not null)
        {
            // Fix #7: Existing-user path must verify identity via password to prevent
            // an intercepted token from silently linking an arbitrary registered user to a gym.
            if (string.IsNullOrWhiteSpace(request.Password))
                return Result.Failure<AuthResponse>("Password is required to link an existing account.");

            if (!passwordHasher.Verify(request.Password, existingUser.PasswordHash))
                return Result.Failure<AuthResponse>("Invalid credentials.");

            user = existingUser;
        }
        else
        {
            // New user: require password and fullName
            if (string.IsNullOrWhiteSpace(request.Password))
                return Result.Failure<AuthResponse>("Password is required for new user registration.");

            if (string.IsNullOrWhiteSpace(request.FullName))
                return Result.Failure<AuthResponse>("Full name is required for new user registration.");

            var passwordHash = passwordHasher.Hash(request.Password);

#pragma warning disable CS0618
            user = new User
            {
                Email = invitation.Email,
                PasswordHash = passwordHash,
                FullName = request.FullName,
                Role = invitation.Role,
                Permissions = RolePermissionDefaults.GetDefaultPermissions(invitation.Role)
            };
#pragma warning restore CS0618

            await userRepository.CreateAsync(user, ct);
        }

        // 3. Create Member or Staff record linking user to the gym house
        await CreateGymAssociationAsync(user, invitation, ct);

        // 4. Seed role_permissions if not existing for tenant
        var permissionsSeeded = await rolePermissionRepository.ExistsForTenantAsync(invitation.TenantId, ct);
        if (!permissionsSeeded)
        {
            var defaults = RolePermissionDefaults.GetDefaultRolePermissions(invitation.TenantId);
            await rolePermissionRepository.UpsertRangeAsync(defaults, ct);
        }

        // 5. Generate tokens — persist refresh token first so JWT tenant_id resolves correctly
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

    private async Task CreateGymAssociationAsync(
        User user, Invitation invitation, CancellationToken ct)
    {
        if (invitation.Role == Role.Member)
        {
            var alreadyMember = await memberRepository.ExistsByEmailAndHouseAsync(
                user.Email, invitation.GymHouseId, ct);

            if (!alreadyMember)
            {
                var sequence = await memberRepository.GetNextSequenceAsync(invitation.GymHouseId, ct);
                var memberCode = Member.GenerateMemberCode("GM", sequence);

                var member = new Member
                {
                    UserId = user.Id,
                    GymHouseId = invitation.GymHouseId,
                    MemberCode = memberCode
                };

                await memberRepository.CreateAsync(member, ct);
            }
        }
        else
        {
            // Staff roles: HouseManager, Trainer, Staff
            var alreadyStaff = await staffRepository.ExistsAsync(user.Id, invitation.GymHouseId, ct);

            if (!alreadyStaff)
            {
                var staffType = invitation.Role switch
                {
                    Role.Trainer => StaffType.Trainer,
                    _ => StaffType.Reception
                };

                var staff = new StaffEntity
                {
                    UserId = user.Id,
                    GymHouseId = invitation.GymHouseId,
                    StaffType = staffType,
                    BaseSalary = 0m,
                    PerClassBonus = 0m
                };

                await staffRepository.CreateAsync(staff, ct);
            }
        }
    }
}
