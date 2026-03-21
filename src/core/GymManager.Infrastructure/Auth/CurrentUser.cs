using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Enums;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace GymManager.Infrastructure.Auth;

public sealed class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal =>
        httpContextAccessor.HttpContext?.User;

    public Guid UserId
    {
        get
        {
            var sub = Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? Principal?.FindFirst("sub")?.Value;
            return Guid.TryParse(sub, out var id) ? id : Guid.Empty;
        }
    }

    public Guid TenantId
    {
        get
        {
            // Return Guid.Empty when the tenant_id claim is missing or unparseable rather than
            // falling back to UserId. The fallback to UserId was masking auth bugs: a user without
            // a tenant_id claim would be treated as an Owner (tenant_id == user_id), potentially
            // granting elevated access. Guid.Empty is an honest "no tenant association" signal
            // that downstream permission checks will correctly deny.
            var raw = Principal?.FindFirst("tenant_id")?.Value;
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }
    }

    public string Email =>
        Principal?.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;

    public Permission Permissions
    {
        get
        {
            var raw = Principal?.FindFirst("permissions")?.Value;
            return long.TryParse(raw, out var val) ? (Permission)val : Permission.None;
        }
    }

    public Role Role
    {
        get
        {
            var raw = Principal?.FindFirst("role")?.Value;
            return Enum.TryParse<Role>(raw, out var role) ? role : Role.Member;
        }
    }

    public bool IsAuthenticated =>
        Principal?.Identity?.IsAuthenticated ?? false;
}
