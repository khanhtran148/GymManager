using FluentAssertions;
using GymManager.Application.Auth.Register;
using Xunit;

namespace GymManager.Application.Tests.Auth;

public sealed class RegisterCommandHandlerTests : ApplicationTestBase
{
    [Fact]
    public async Task Register_WithValidData_Succeeds()
    {
        var (_, gymHouse) = await CreateOwnerAsync("owner@regtest.com", "Reg Test Gym");

        var command = new RegisterCommand(
            "newmember@example.com", "Password123!", "New Member", null, gymHouse.Id);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.UserId.Should().NotBeEmpty();
        result.Value.AccessToken.Should().NotBeNullOrEmpty();
        result.Value.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_Fails()
    {
        var (_, gymHouse) = await CreateOwnerAsync("owner@regdupe.com", "Reg Dupe Gym");

        await Sender.Send(new RegisterCommand(
            "duplicate@example.com", "Password123!", "First User", null, gymHouse.Id));

        var command = new RegisterCommand(
            "duplicate@example.com", "Password123!", "Second User", null, gymHouse.Id);

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("already registered");
    }

    [Fact]
    public async Task Register_WithShortPassword_ThrowsValidationException()
    {
        var command = new RegisterCommand("test@example.com", "short", "Test", null, Guid.NewGuid());

        var act = async () => await Sender.Send(command);

        await act.Should().ThrowAsync<FluentValidation.ValidationException>();
    }

    [Fact]
    public async Task Register_WithInvalidEmail_ThrowsValidationException()
    {
        var command = new RegisterCommand("not-an-email", "Password123!", "Test", null, Guid.NewGuid());

        var act = async () => await Sender.Send(command);

        await act.Should().ThrowAsync<FluentValidation.ValidationException>();
    }

    [Fact]
    public async Task Register_WithEmptyGymHouseId_ThrowsValidationException()
    {
        var command = new RegisterCommand("test@example.com", "Password123!", "Test", null, Guid.Empty);

        var act = async () => await Sender.Send(command);

        await act.Should().ThrowAsync<FluentValidation.ValidationException>();
    }
}
