using GymManager.Application.Common.Constants;
using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace GymManager.Infrastructure.Auth;

public sealed class JwtTokenService(
    IConfiguration configuration,
    IRolePermissionRepository rolePermissionRepository,
    IMemoryCache cache,
    GymManagerDbContext db) : ITokenService
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    public async Task<string> GenerateAccessTokenAsync(User user, CancellationToken ct = default)
    {
        var secret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret configuration is missing.");
        var issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Jwt:Issuer configuration is missing.");
        var audience = configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Jwt:Audience configuration is missing.");

        var permissions = await ResolvePermissionsAsync(user, ct);

        var tenantId = user.Role == Role.Owner
            ? user.Id
            : (await ResolveTenantIdAsync(user.Id, ct) ?? user.Id);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new("role", user.Role.ToString()),
            new("permissions", ((long)permissions).ToString()),
            new("tenant_id", tenantId.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddMinutes(TokenDefaults.AccessTokenExpiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var secret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret configuration is missing.");
        var issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Jwt:Issuer configuration is missing.");
        var audience = configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Jwt:Audience configuration is missing.");

        var parameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = false
        };

        var handler = new JwtSecurityTokenHandler();
        return handler.ValidateToken(token, parameters, out _);
    }

    private async Task<Permission> ResolvePermissionsAsync(User user, CancellationToken ct)
    {
        // Owner always gets full Admin permissions — cannot be demoted
        if (user.Role == Role.Owner)
            return Permission.Admin;

        var cacheKey = $"role_permissions:user:{user.Id}:{user.Role}";

        if (cache.TryGetValue(cacheKey, out Permission cached))
            return cached;

        // Resolve the tenant (Owner's userId) for this non-owner user via their gym house membership
        var tenantId = await ResolveTenantIdAsync(user.Id, ct);

        if (tenantId is null)
        {
            // No tenant association found — fall back to stored user.Permissions (deprecated fallback)
#pragma warning disable CS0618
            return user.Permissions;
#pragma warning restore CS0618
        }

        var rolePermission = await rolePermissionRepository
            .GetByTenantAndRoleAsync(tenantId.Value, user.Role, ct);

#pragma warning disable CS0618
        var resolved = rolePermission?.Permissions ?? user.Permissions;
#pragma warning restore CS0618

        cache.Set(cacheKey, resolved, CacheTtl);

        return resolved;
    }

    private async Task<Guid?> ResolveTenantIdAsync(Guid userId, CancellationToken ct)
    {
        // Look up which GymHouse (and thus Owner/Tenant) this user belongs to
        // via Member or Staff association, then return that GymHouse's OwnerId
        var tenantId = await db.Members
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.DeletedAt == null)
            .Select(m => (Guid?)db.GymHouses
                .Where(g => g.Id == m.GymHouseId)
                .Select(g => g.OwnerId)
                .FirstOrDefault())
            .FirstOrDefaultAsync(ct);

        if (tenantId is not null && tenantId != Guid.Empty)
            return tenantId;

        tenantId = await db.Staff
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.DeletedAt == null)
            .Select(s => (Guid?)db.GymHouses
                .Where(g => g.Id == s.GymHouseId)
                .Select(g => g.OwnerId)
                .FirstOrDefault())
            .FirstOrDefaultAsync(ct);

        return tenantId == Guid.Empty ? null : tenantId;
    }
}
