using GymManager.Domain.Entities;
using System.Security.Claims;

namespace GymManager.Application.Common.Interfaces;

public interface ITokenService
{
    Task<string> GenerateAccessTokenAsync(User user, CancellationToken ct = default);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
