using FluentAssertions;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Domain.Tests.Entities;

public sealed class UserTests
{
    [Fact]
    public void User_HasDefaultProperties_WhenCreated()
    {
        var user = new User
        {
            Email = "test@example.com",
            FullName = "Test User",
            Role = Role.Owner
        };

        user.Id.Should().NotBeEmpty();
        user.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        user.DeletedAt.Should().BeNull();
    }

    [Fact]
    public void SetRefreshToken_SetsTokenAndExpiry()
    {
        var user = new User();
        var token = "test-refresh-token";
        var expiry = DateTime.UtcNow.AddDays(7);

        user.SetRefreshToken(token, expiry);

        user.RefreshToken.Should().Be(token);
        user.RefreshTokenExpiresAt.Should().Be(expiry);
    }

    [Fact]
    public void IsRefreshTokenValid_ReturnsTrue_WhenTokenMatchesAndNotExpired()
    {
        var user = new User();
        var token = "valid-token";
        user.SetRefreshToken(token, DateTime.UtcNow.AddDays(7));

        var result = user.IsRefreshTokenValid(token);

        result.Should().BeTrue();
    }

    [Fact]
    public void IsRefreshTokenValid_ReturnsFalse_WhenTokenDoesNotMatch()
    {
        var user = new User();
        user.SetRefreshToken("real-token", DateTime.UtcNow.AddDays(7));

        var result = user.IsRefreshTokenValid("wrong-token");

        result.Should().BeFalse();
    }

    [Fact]
    public void IsRefreshTokenValid_ReturnsFalse_WhenTokenExpired()
    {
        var user = new User();
        var token = "expired-token";
        user.SetRefreshToken(token, DateTime.UtcNow.AddSeconds(-1));

        var result = user.IsRefreshTokenValid(token);

        result.Should().BeFalse();
    }
}
