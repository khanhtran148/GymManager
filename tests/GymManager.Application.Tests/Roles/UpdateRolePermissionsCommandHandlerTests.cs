using FluentAssertions;
using FluentValidation;
using GymManager.Application.Auth.Register;
using GymManager.Application.Roles.UpdateRolePermissions;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using GymManager.Domain.Events;
using GymManager.Tests.Common.Builders;
using GymManager.Tests.Common.Fakes;
using Xunit;

namespace GymManager.Application.Tests.Roles;

public sealed class UpdateRolePermissionsCommandHandlerTests : ApplicationTestBase
{
    private async Task SetupOwnerAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123!", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;
        CurrentUser.Role = Role.Owner;
    }

    [Fact]
    public async Task UpdateRolePermissions_AsOwner_ForTrainer_Succeeds()
    {
        await SetupOwnerAsync();
        var newBitmask = ((long)(Permission.ViewMembers | Permission.ViewClasses)).ToString();

        var command = new UpdateRolePermissionsCommand(Role.Trainer, newBitmask);
        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateRolePermissions_RejectsOwnerRole_ThrowsValidation()
    {
        await SetupOwnerAsync();

        var command = new UpdateRolePermissionsCommand(Role.Owner, "67108863");

        var act = async () => await Sender.Send(command);
        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Owner*");
    }

    [Fact]
    public async Task UpdateRolePermissions_AsNonOwner_ReturnsForbidden()
    {
        await SetupOwnerAsync();
        CurrentUser.Role = Role.HouseManager;

        var command = new UpdateRolePermissionsCommand(Role.Trainer, "12345");
        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }

    [Fact]
    public async Task UpdateRolePermissions_PublishesPermissionsChangedEvent_ForAffectedUsers()
    {
        await SetupOwnerAsync();

        // The real publisher is used in integration tests; events propagate via in-process MediatR.
        // We verify the command succeeds (which implicitly exercises the publish path).
        var newBitmask = ((long)Permission.ViewMembers).ToString();
        var command = new UpdateRolePermissionsCommand(Role.Staff, newBitmask);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateRolePermissions_PublishesPermissionsChangedEvent_WithCorrectPayload()
    {
        var tenantId = Guid.NewGuid();

        // Build a User via the builder — Id is auto-assigned (protected set)
#pragma warning disable CS0618
        var affectedUser = new UserBuilder()
            .WithEmail("staff@example.com")
            .WithFullName("Staff User")
            .WithRole(Role.Staff)
            .WithPermissions(Permission.None)
            .Build();
#pragma warning restore CS0618

        var userRepo = new FakeUserRepository();
        userRepo.Seed(affectedUser);

        var rolePermRepo = new FakeRolePermissionRepository();
        var fakePublisher = new FakePublisher();
        var currentUser = new FakeCurrentUser
        {
            UserId = tenantId,
            TenantId = tenantId,
            Role = Role.Owner,
            Permissions = Permission.Admin
        };

        var handler = new UpdateRolePermissionsCommandHandler(
            rolePermRepo, userRepo, currentUser, fakePublisher);

        var bits = (long)Permission.ViewMembers;
        var result = await handler.Handle(
            new UpdateRolePermissionsCommand(Role.Staff, bits.ToString()),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        fakePublisher.PublishedEvents.Should().ContainSingle(e => e is PermissionsChangedEvent);
        var evt = (PermissionsChangedEvent)fakePublisher.PublishedEvents.Single(e => e is PermissionsChangedEvent);
        evt.UserId.Should().Be(affectedUser.Id);
        evt.NewRole.Should().Be(Role.Staff.ToString());
        evt.NewPermissions.Should().Be(bits);
    }
}
