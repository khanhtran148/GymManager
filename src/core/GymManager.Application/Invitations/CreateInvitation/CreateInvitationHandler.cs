using CSharpFunctionalExtensions;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.Common.Models;
using GymManager.Application.Common.Options;
using GymManager.Application.Invitations.Shared;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using MediatR;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;

namespace GymManager.Application.Invitations.CreateInvitation;

public sealed class CreateInvitationHandler(
    IInvitationRepository invitationRepository,
    IGymHouseRepository gymHouseRepository,
    IPermissionChecker permissions,
    ICurrentUser currentUser,
    IOptions<InviteOptions> inviteOptions)
    : IRequestHandler<CreateInvitationCommand, Result<InvitationDto>>
{
    public async Task<Result<InvitationDto>> Handle(
        CreateInvitationCommand request, CancellationToken ct)
    {
        // 1. Permission check — ManageStaff OR ManageRoles
        var canManage = await permissions.HasPermissionAsync(
            currentUser.UserId, currentUser.TenantId, Permission.ManageStaff, ct)
            || await permissions.HasPermissionAsync(
            currentUser.UserId, currentUser.TenantId, Permission.ManageRoles, ct);

        if (!canManage)
            return Result.Failure<InvitationDto>(new ForbiddenError().ToString());

        // 2. Validate gymHouseId exists (validator ensures Role != Owner)
        var gymHouse = await gymHouseRepository.GetByIdAsync(request.GymHouseId, ct);
        if (gymHouse is null)
            return Result.Failure<InvitationDto>(new NotFoundError("GymHouse", request.GymHouseId).ToString());

        // 3. Check no pending invite for (email, tenantId)
        var hasPending = await invitationRepository.HasPendingInviteAsync(
            request.Email, currentUser.TenantId, ct);
        if (hasPending)
            return Result.Failure<InvitationDto>(
                new ConflictError($"A pending invitation already exists for '{request.Email}' in this gym.").ToString());

        // 4. Generate 32-byte cryptographic random token (URL-safe Base64, no padding)
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var token = Convert.ToBase64String(tokenBytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');

        // 5. Create Invitation with 48-hour expiry
        var invitation = new Invitation
        {
            TenantId = currentUser.TenantId,
            Email = request.Email.ToLowerInvariant(),
            Role = request.Role,
            GymHouseId = request.GymHouseId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(48),
            CreatedBy = currentUser.UserId
        };

        await invitationRepository.CreateAsync(invitation, ct);

        // 6. Build invite URL
        var baseUrl = inviteOptions.Value.InviteBaseUrl;
        var inviteUrl = $"{baseUrl}/{token}";

        return Result.Success(new InvitationDto(
            invitation.Id,
            invitation.Email,
            invitation.Role.ToString(),
            invitation.GymHouseId,
            invitation.Token,
            invitation.ExpiresAt,
            inviteUrl));
    }
}
