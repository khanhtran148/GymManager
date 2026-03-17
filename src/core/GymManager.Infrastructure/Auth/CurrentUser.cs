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

    public Guid TenantId => UserId; // For Owner role: TenantId == UserId (owning all their houses)

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

    public bool IsAuthenticated =>
        Principal?.Identity?.IsAuthenticated ?? false;
}
