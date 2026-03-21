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

public sealed class JwtTokenService : ITokenService
{
    private readonly IRolePermissionRepository _rolePermissionRepository;
    private readonly IMemoryCache _cache;
    private readonly GymManagerDbContext _db;

    // Fix #9: Cache JWT config values read once in the constructor so GenerateAccessTokenAsync
    // and GetPrincipalFromExpiredToken do not re-read IConfiguration on every call.
    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;

    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    public JwtTokenService(
        IConfiguration configuration,
        IRolePermissionRepository rolePermissionRepository,
        IMemoryCache cache,
        GymManagerDbContext db)
    {
        _rolePermissionRepository = rolePermissionRepository;
        _cache = cache;
        _db = db;

        _secret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret configuration is missing.");
        _issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Jwt:Issuer configuration is missing.");
        _audience = configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Jwt:Audience configuration is missing.");
    }

    public async Task<string> GenerateAccessTokenAsync(User user, CancellationToken ct = default)
    {
        // Fix #9: Resolve tenant once and pass it to ResolvePermissionsAsync to avoid
        // a second DB round-trip inside that method for non-Owner users.
        var tenantId = user.Role == Role.Owner
            ? user.Id
            : (await ResolveTenantIdAsync(user.Id, ct) ?? Guid.Empty); // Fix #5: use Guid.Empty, not user.Id

        var permissions = await ResolvePermissionsAsync(user, tenantId, ct);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
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
            issuer: _issuer,
            audience: _audience,
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
        var parameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret)),
            ValidateIssuer = true,
            ValidIssuer = _issuer,
            ValidateAudience = true,
            ValidAudience = _audience,
            ValidateLifetime = false
        };

        var handler = new JwtSecurityTokenHandler();
        return handler.ValidateToken(token, parameters, out _);
    }

    // Fix #9: Accept pre-resolved tenantId so GenerateAccessTokenAsync can pass it in,
    // avoiding a second ResolveTenantIdAsync call that was previously made inside here.
    private async Task<Permission> ResolvePermissionsAsync(User user, Guid tenantId, CancellationToken ct)
    {
        // Owner always gets full Admin permissions — cannot be demoted
        if (user.Role == Role.Owner)
            return Permission.Admin;

        var cacheKey = $"role_permissions:user:{user.Id}:{user.Role}";

        if (_cache.TryGetValue(cacheKey, out Permission cached))
            return cached;

        if (tenantId == Guid.Empty)
        {
            // No tenant association found — fall back to stored user.Permissions (deprecated fallback)
#pragma warning disable CS0618
            return user.Permissions;
#pragma warning restore CS0618
        }

        var rolePermission = await _rolePermissionRepository
            .GetByTenantAndRoleAsync(tenantId, user.Role, ct);

#pragma warning disable CS0618
        var resolved = rolePermission?.Permissions ?? user.Permissions;
#pragma warning restore CS0618

        _cache.Set(cacheKey, resolved, CacheTtl);

        return resolved;
    }

    private async Task<Guid?> ResolveTenantIdAsync(Guid userId, CancellationToken ct)
    {
        // Look up which GymHouse (and thus Owner/Tenant) this user belongs to
        // via Member or Staff association, then return that GymHouse's OwnerId
        var tenantId = await _db.Members
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.DeletedAt == null)
            .Select(m => (Guid?)_db.GymHouses
                .Where(g => g.Id == m.GymHouseId)
                .Select(g => g.OwnerId)
                .FirstOrDefault())
            .FirstOrDefaultAsync(ct);

        if (tenantId is not null && tenantId != Guid.Empty)
            return tenantId;

        tenantId = await _db.Staff
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.DeletedAt == null)
            .Select(s => (Guid?)_db.GymHouses
                .Where(g => g.Id == s.GymHouseId)
                .Select(g => g.OwnerId)
                .FirstOrDefault())
            .FirstOrDefaultAsync(ct);

        return tenantId == Guid.Empty ? null : tenantId;
    }
}
