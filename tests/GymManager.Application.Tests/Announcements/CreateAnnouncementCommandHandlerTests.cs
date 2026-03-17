using FluentAssertions;
using FluentValidation;
using GymManager.Application.Announcements.CreateAnnouncement;
using GymManager.Application.Auth.Register;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Domain.Entities;
using GymManager.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GymManager.Application.Tests.Announcements;

public sealed class CreateAnnouncementCommandHandlerTests : ApplicationTestBase
{
    private async Task<(Guid OwnerId, Guid GymHouseId)> SetupOwnerAndHouseAsync()
    {
        var reg = await Sender.Send(new RegisterCommand(
            $"owner{Guid.NewGuid()}@example.com", "Password123!", "Owner", null));
        CurrentUser.UserId = reg.Value.UserId;
        CurrentUser.TenantId = reg.Value.UserId;
        CurrentUser.Permissions = Permission.Admin;

        var house = await Sender.Send(new CreateGymHouseCommand("Test Gym", "123 Test St", null, null, 50));
        return (reg.Value.UserId, house.Value.Id);
    }

    [Fact]
    public async Task CreateAnnouncement_WithManageAnnouncementsPermission_Succeeds()
    {
        var (authorId, gymHouseId) = await SetupOwnerAndHouseAsync();
        var publishAt = DateTime.UtcNow.AddHours(1);

        var command = new CreateAnnouncementCommand(
            gymHouseId,
            authorId,
            "Test Announcement",
            "Test content for the announcement.",
            TargetAudience.AllMembers,
            publishAt);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.Title.Should().Be("Test Announcement");
        result.Value.Content.Should().Be("Test content for the announcement.");
        result.Value.TargetAudience.Should().Be(TargetAudience.AllMembers);
        result.Value.GymHouseId.Should().Be(gymHouseId);
        result.Value.IsPublished.Should().BeFalse();
    }

    [Fact]
    public async Task CreateAnnouncement_ChainWide_NullGymHouseId_WithOwnerRole_Succeeds()
    {
        var (authorId, _) = await SetupOwnerAndHouseAsync();
        var publishAt = DateTime.UtcNow.AddHours(1);

        var command = new CreateAnnouncementCommand(
            null,
            authorId,
            "Chain-Wide Announcement",
            "This goes to all members.",
            TargetAudience.Everyone,
            publishAt);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.GymHouseId.Should().BeNull();
    }

    [Fact]
    public async Task CreateAnnouncement_ChainWide_WithoutOwnerRole_ReturnsForbidden()
    {
        // Create a Staff user directly (not via Register, which always sets Owner)
        var staffUser = new User
        {
            Email = $"staff{Guid.NewGuid()}@example.com",
            PasswordHash = "hash",
            FullName = "Staff User",
            Role = Role.Staff,
            Permissions = Permission.ManageAnnouncements
        };
        DbContext.Users.Add(staffUser);
        await DbContext.SaveChangesAsync();

        // Set current user as the Staff member
        CurrentUser.UserId = staffUser.Id;
        CurrentUser.TenantId = staffUser.Id;
        CurrentUser.Permissions = Permission.ManageAnnouncements;

        var command = new CreateAnnouncementCommand(
            null,
            staffUser.Id,
            "Chain-Wide Announcement",
            "This goes to all members.",
            TargetAudience.Everyone,
            DateTime.UtcNow.AddHours(1));

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.ToLower().Should().Contain("chain-wide");
    }

    [Fact]
    public async Task CreateAnnouncement_WithoutManageAnnouncementsPermission_ReturnsForbidden()
    {
        var (authorId, gymHouseId) = await SetupOwnerAndHouseAsync();
        CurrentUser.Permissions = Permission.ViewAnnouncements;

        var command = new CreateAnnouncementCommand(
            gymHouseId,
            authorId,
            "Announcement",
            "Content",
            TargetAudience.AllMembers,
            DateTime.UtcNow.AddHours(1));

        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
    }

    [Fact]
    public async Task CreateAnnouncement_PublishAtInPast_ThrowsValidationException()
    {
        var (authorId, gymHouseId) = await SetupOwnerAndHouseAsync();

        var command = new CreateAnnouncementCommand(
            gymHouseId,
            authorId,
            "Announcement",
            "Content",
            TargetAudience.AllMembers,
            DateTime.UtcNow.AddHours(-1));

        var act = () => Sender.Send(command);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*PublishAt*");
    }
}
