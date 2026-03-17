using GymManager.Domain.Common;
using GymManager.Domain.Enums;

namespace GymManager.Domain.Entities;

public sealed class User : AuditableEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public Role Role { get; set; }

    /// <summary>
    /// Cached permission bitmask kept for backward compatibility during the migration period.
    /// New code must read permissions from the <c>role_permissions</c> table (via <c>IRolePermissionRepository</c>
    /// or at JWT issuance time via <c>JwtTokenService</c>).
    /// Writing to this property directly is deprecated; use <c>IRolePermissionRepository.UpsertAsync</c>
    /// or <c>ChangeUserRoleCommandHandler</c> which keeps this field in sync automatically.
    /// </summary>
    [Obsolete("Use role_permissions table for permission management. Direct writes will be removed in v2.")]
    public Permission Permissions { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }

    public void SetRefreshToken(string token, DateTime expiresAt)
    {
        RefreshToken = token;
        RefreshTokenExpiresAt = expiresAt;
    }

    public bool IsRefreshTokenValid(string token) =>
        RefreshToken == token && RefreshTokenExpiresAt > DateTime.UtcNow;
}
