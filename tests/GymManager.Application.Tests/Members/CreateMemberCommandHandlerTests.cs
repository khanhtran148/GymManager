using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Members.CreateMember;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Members;

public sealed class CreateMemberCommandHandlerTests : ApplicationTestBase
{
    private async Task<(Guid OwnerId, Guid GymHouseId)> SetupOwnerAndHouseAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var house = await Sender.Send(new CreateGymHouseCommand("Test Gym", "123 Test St", null, null, 50));
        return (reg.Value.UserId, house.Value.Id);
    }

    [Fact]
    public async Task CreateMember_WithManageMembersPermission_Succeeds()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var command = new CreateMemberCommand(gymHouseId, "member@example.com", "John Doe", "555-1234");

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Email.Should().Be("member@example.com");
        result.Value.FullName.Should().Be("John Doe");
        result.Value.MemberCode.Should().NotBeNullOrEmpty();
        result.Value.GymHouseId.Should().Be(gymHouseId);
    }

    [Fact]
    public async Task CreateMember_DuplicateEmail_InSameHouse_Fails()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        await Sender.Send(new CreateMemberCommand(gymHouseId, "duplicate@example.com", "First Member", null));

        var result = await Sender.Send(new CreateMemberCommand(gymHouseId, "duplicate@example.com", "Second Member", null));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("already exists");
    }

    [Fact]
    public async Task CreateMember_WithoutManageMembersPermission_Fails()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        CurrentUser.Permissions = Permission.ViewMembers; // No ManageMembers

        var command = new CreateMemberCommand(gymHouseId, "m@example.com", "Member", null);

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
    }
}
