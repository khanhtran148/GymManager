using FluentAssertions;
using GymManager.Infrastructure.Auth;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Xunit;

namespace GymManager.Infrastructure.Tests.Auth;

public sealed class CurrentUserTenantIdTests
{
    private static CurrentUser BuildCurrentUser(IEnumerable<Claim> claims)
    {
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext
        {
            User = principal
        };

        var accessor = new HttpContextAccessor { HttpContext = httpContext };
        return new CurrentUser(accessor);
    }

    [Fact]
    public void TenantId_WhenTenantIdClaimPresent_ReturnsTenantId()
    {
        var userId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();

        var currentUser = BuildCurrentUser(
        [
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim("tenant_id", tenantId.ToString())
        ]);

        currentUser.TenantId.Should().Be(tenantId);
        currentUser.TenantId.Should().NotBe(userId);
    }

    [Fact]
    public void TenantId_WhenNoTenantIdClaim_ReturnsGuidEmpty()
    {
        var userId = Guid.NewGuid();

        var currentUser = BuildCurrentUser(
        [
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        ]);

        // Fix #4: Returns Guid.Empty (not UserId) when tenant_id claim is absent,
        // so callers cannot accidentally gain Owner-level access on a missing claim.
        currentUser.TenantId.Should().Be(Guid.Empty);
        currentUser.TenantId.Should().NotBe(userId);
    }

    [Fact]
    public void TenantId_WhenTenantIdClaimEqualToUserId_ReturnsUserId()
    {
        var id = Guid.NewGuid();

        var currentUser = BuildCurrentUser(
        [
            new Claim(ClaimTypes.NameIdentifier, id.ToString()),
            new Claim("tenant_id", id.ToString())
        ]);

        currentUser.TenantId.Should().Be(id);
    }

    [Fact]
    public void TenantId_WhenTenantIdClaimIsInvalid_ReturnsGuidEmpty()
    {
        var userId = Guid.NewGuid();

        var currentUser = BuildCurrentUser(
        [
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim("tenant_id", "not-a-guid")
        ]);

        // Fix #4: Returns Guid.Empty (not UserId) when tenant_id claim is unparseable,
        // so callers cannot accidentally gain Owner-level access on a malformed claim.
        currentUser.TenantId.Should().Be(Guid.Empty);
        currentUser.TenantId.Should().NotBe(userId);
    }
}
