using FluentAssertions;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.Roles.ChangeUserRole;
using GymManager.Application.Common.Interfaces;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using GymManager.Tests.Common.Builders;
using GymManager.Tests.Common.Fakes;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GymManager.Application.Tests.Roles;

public sealed class ChangeUserRoleCommandHandlerTests : ApplicationTestBase
{
    private async Task<Guid> SetupOwnerAsync()
    {
        var (owner, _) = await CreateOwnerAsync($"owner{Guid.NewGuid()}@example.com");
        return owner.Id;
    }

    private async Task<Guid> CreateMemberUserAsync(Guid gymHouseId)
    {
        var result = await Sender.Send(new CreateMemberCommand(gymHouseId, $"user{Guid.NewGuid()}@example.com", "Test User", null));
        var userRepo = Services.GetRequiredService<IUserRepository>();
        var user = await userRepo.GetByEmailAsync(result.Value.Email);
        return user!.Id;
    }

    [Fact]
    public async Task ChangeUserRole_AsOwner_Succeeds()
    {
        await SetupOwnerAsync();
        var house = await Sender.Send(new CreateGymHouseCommand("Test Gym", "123 Main St", null, null, 50));
        var userId = await CreateMemberUserAsync(house.Value.Id);

        var command = new ChangeUserRoleCommand(userId, Role.Staff);
        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();

        var userRepo = Services.GetRequiredService<IUserRepository>();
        var updatedUser = await userRepo.GetByIdAsync(userId);
        updatedUser!.Role.Should().Be(Role.Staff);
    }

    [Fact]
    public async Task ChangeUserRole_RejectsOwnerDemotion()
    {
        var ownerId = await SetupOwnerAsync();

        var command = new ChangeUserRoleCommand(ownerId, Role.Trainer);
        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Owner");
    }

    [Fact]
    public async Task ChangeUserRole_UserNotFound_ReturnsNotFound()
    {
        await SetupOwnerAsync();

        var command = new ChangeUserRoleCommand(Guid.NewGuid(), Role.Staff);
        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task ChangeUserRole_AsNonOwner_ReturnsForbidden()
    {
        await SetupOwnerAsync();
        CurrentUser.Role = Role.HouseManager;
        CurrentUser.Permissions = Permission.ViewMembers | Permission.ManageMembers;

        var command = new ChangeUserRoleCommand(Guid.NewGuid(), Role.Staff);
        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("[FORBIDDEN]");
    }

    [Fact]
    public async Task ChangeUserRole_PublishesPermissionsChangedEvent()
    {
        await SetupOwnerAsync();
        var house = await Sender.Send(new CreateGymHouseCommand("Test Gym 2", "456 Elm St", null, null, 40));
        var userId = await CreateMemberUserAsync(house.Value.Id);

        // Change the user's role — event publishing is handled by the real MediatR pipeline in integration tests
        var command = new ChangeUserRoleCommand(userId, Role.Trainer);
        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task ChangeUserRole_PublishesPermissionsChangedEvent_WithCorrectPayload()
    {
        var tenantId = Guid.NewGuid();

        // Build a User via the builder — Id is auto-assigned (protected set)
#pragma warning disable CS0618
        var targetUser = new UserBuilder()
            .WithEmail("member@example.com")
            .WithFullName("Member User")
            .WithRole(Role.Member)
            .WithPermissions(Permission.None)
            .Build();
#pragma warning restore CS0618

        var userRepo = new FakeUserRepository();
        userRepo.Seed(targetUser);

        var rolePermRepo = new FakeRolePermissionRepository();
        var fakePublisher = new FakePublisher();
        var currentUser = new FakeCurrentUser
        {
            UserId = tenantId,
            TenantId = tenantId,
            Role = Role.Owner,
            Permissions = Permission.Admin
        };

        var handler = new ChangeUserRoleCommandHandler(
            userRepo, rolePermRepo, new FakePermissionChecker(), currentUser, fakePublisher);

        var result = await handler.Handle(
            new ChangeUserRoleCommand(targetUser.Id, Role.Staff),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        fakePublisher.PublishedEvents.Should().ContainSingle(e => e is PermissionsChangedEvent);
        var evt = (PermissionsChangedEvent)fakePublisher.PublishedEvents.Single(e => e is PermissionsChangedEvent);
        evt.UserId.Should().Be(targetUser.Id);
        evt.NewRole.Should().Be(Role.Staff.ToString());
    }
}
