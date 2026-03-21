using FluentAssertions;
using GymManager.Application.Auth.Login;
using Xunit;

namespace GymManager.Application.Tests.Auth;

public sealed class LoginCommandHandlerTests : ApplicationTestBase
{
    [Fact]
    public async Task Login_WithCorrectCredentials_Succeeds()
    {
        await CreateOwnerAsync("logintest@example.com", "Login Test Gym");

        var result = await Sender.Send(new LoginCommand("logintest@example.com", "Test@1234"));

        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().NotBeNullOrEmpty();
        result.Value.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_WithWrongPassword_Fails()
    {
        await CreateOwnerAsync("wrongpass@example.com", "Wrong Pass Gym");

        var result = await Sender.Send(new LoginCommand("wrongpass@example.com", "WrongPassword!"));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Invalid credentials");
    }

    [Fact]
    public async Task Login_WithNonExistentEmail_Fails()
    {
        var result = await Sender.Send(new LoginCommand("nobody@example.com", "Password123!"));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Invalid credentials");
    }
}
