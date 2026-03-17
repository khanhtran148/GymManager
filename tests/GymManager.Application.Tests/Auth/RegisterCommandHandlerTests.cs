using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GymManager.Application.Tests.Auth;

public sealed class RegisterCommandHandlerTests : ApplicationTestBase
{
    [Fact]
    public async Task Register_WithValidData_Succeeds()
    {
        var command = new RegisterCommand("newowner@example.com", "Password123", "New Owner", null);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.UserId.Should().NotBeEmpty();
        result.Value.AccessToken.Should().NotBeNullOrEmpty();
        result.Value.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_Fails()
    {
        // Arrange: create first user
        var db = Services.GetRequiredService<GymManagerDbContext>();
        await Sender.Send(new RegisterCommand("duplicate@example.com", "Password123", "First User", null));

        var command = new RegisterCommand("duplicate@example.com", "Password123", "Second User", null);

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("already registered");
    }

    [Fact]
    public async Task Register_WithShortPassword_ThrowsValidationException()
    {
        var command = new RegisterCommand("test@example.com", "short", "Test", null);

        var act = async () => await Sender.Send(command);

        await act.Should().ThrowAsync<FluentValidation.ValidationException>();
    }

    [Fact]
    public async Task Register_WithInvalidEmail_ThrowsValidationException()
    {
        var command = new RegisterCommand("not-an-email", "Password123", "Test", null);

        var act = async () => await Sender.Send(command);

        await act.Should().ThrowAsync<FluentValidation.ValidationException>();
    }
}
