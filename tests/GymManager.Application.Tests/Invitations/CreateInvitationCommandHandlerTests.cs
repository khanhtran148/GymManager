using FluentAssertions;
using GymManager.Application.Invitations.CreateInvitation;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Invitations;

public sealed class CreateInvitationCommandHandlerTests : ApplicationTestBase
{
    [Fact]
    public async Task Create_WithValidInput_ReturnsInvitationWithToken()
    {
        var (_, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Invite Gym");

        var command = new CreateInvitationCommand(
            "invited@example.com", Role.Staff, gymHouse.Id);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Token.Should().NotBeNullOrEmpty();
        // URL-safe base64 of 32 bytes encodes to 43 chars (no padding)
        result.Value.Token.Length.Should().Be(43);
        result.Value.ExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddHours(48), TimeSpan.FromMinutes(1));
        result.Value.Email.Should().Be("invited@example.com");
        result.Value.Role.Should().Be(Role.Staff.ToString());
        result.Value.GymHouseId.Should().Be(gymHouse.Id);
        result.Value.Id.Should().NotBeEmpty();
        result.Value.InviteUrl.Should().Contain(result.Value.Token);
    }

    [Fact]
    public async Task Create_AsOwner_Succeeds()
    {
        var (_, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Owner Invite Gym");
        CurrentUser.Permissions = Permission.ManageStaff;

        var command = new CreateInvitationCommand(
            "staff@example.com", Role.Trainer, gymHouse.Id);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Create_AsMember_ReturnsForbidden()
    {
        var (_, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Member Invite Gym");
        CurrentUser.Permissions = Permission.None;

        var command = new CreateInvitationCommand(
            "staff@example.com", Role.Staff, gymHouse.Id);

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("FORBIDDEN");
    }

    [Fact]
    public async Task Create_WithOwnerRole_ReturnsBadRequest()
    {
        var (_, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Owner Role Gym");

        var command = new CreateInvitationCommand(
            "anotherowner@example.com", Role.Owner, gymHouse.Id);

        var act = async () => await Sender.Send(command);

        await act.Should().ThrowAsync<FluentValidation.ValidationException>()
            .WithMessage("*Owner*");
    }

    [Fact]
    public async Task Create_DuplicatePendingInvite_ReturnsConflict()
    {
        var (_, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Conflict Gym");

        var command = new CreateInvitationCommand(
            "duplicate@example.com", Role.Staff, gymHouse.Id);

        await Sender.Send(command);

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("CONFLICT");
    }

    [Fact]
    public async Task Create_WithInvalidGymHouseId_ReturnsBadRequest()
    {
        await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Invalid GH Gym");

        var command = new CreateInvitationCommand(
            "staff@example.com", Role.Staff, Guid.NewGuid());

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("NOT_FOUND");
    }

    // Fix #11: ManageRoles permission path not tested
    [Fact]
    public async Task Create_WithManageRolesPermission_Succeeds()
    {
        var (_, gymHouse) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@test.com", "Roles Perm Gym");
        CurrentUser.Permissions = Permission.ManageRoles;

        var command = new CreateInvitationCommand(
            "staffroles@example.com", Role.Staff, gymHouse.Id);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Token.Should().NotBeNullOrEmpty();
    }
}
