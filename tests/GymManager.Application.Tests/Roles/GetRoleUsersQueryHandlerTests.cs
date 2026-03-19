using FluentAssertions;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.Roles.GetRoleUsers;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Roles;

public sealed class GetRoleUsersQueryHandlerTests : ApplicationTestBase
{
    private async Task<Guid> SetupOwnerAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123!", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;
        CurrentUser.Role = Role.Owner;
        return reg.Value.UserId;
    }

    [Fact]
    public async Task GetRoleUsers_AsOwner_ReturnsUsersWithRole()
    {
        await SetupOwnerAsync();
        var house = await Sender.Send(new CreateGymHouseCommand("Test Gym", "123 Main St", null, null, 50));
        // Create a member user in the gym
        await Sender.Send(new CreateMemberCommand(house.Value.Id, "member1@example.com", "Member One", null));

        var result = await Sender.Send(new GetRoleUsersQuery(Role.Member, 1, 20));

        result.IsSuccess.Should().BeTrue();
        result.Value.Items.Should().NotBeEmpty();
        result.Value.Items.Should().AllSatisfy(u => u.Role.Should().Be("Member"));
    }

    [Fact]
    public async Task GetRoleUsers_AsNonOwner_ReturnsForbidden()
    {
        await SetupOwnerAsync();
        CurrentUser.Role = Role.Trainer;
        CurrentUser.Permissions = Permission.ViewMembers | Permission.ManageMembers;

        var result = await Sender.Send(new GetRoleUsersQuery(Role.Member, 1, 20));

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("[FORBIDDEN]");
    }
}
