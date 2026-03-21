using FluentAssertions;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Staff.CreateStaff;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Staff;

public sealed class CreateStaffCommandHandlerTests : ApplicationTestBase
{
    private async Task<(Guid OwnerId, Guid GymHouseId)> SetupOwnerAndHouseAsync()
    {
        var (owner, gymHouse) = await CreateOwnerAsync(
            $"owner{Guid.NewGuid()}@example.com", "Staff Test Gym");
        return (owner.Id, gymHouse.Id);
    }

    [Fact]
    public async Task CreateStaff_WithValidData_Succeeds()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var (staffUser, _) = await CreateMemberAsync(gymHouseId, $"staff{Guid.NewGuid()}@example.com");

        var command = new CreateStaffCommand(
            staffUser.Id, gymHouseId, StaffType.Trainer, 5000m, 50m);

        var result = await Sender.Send(command);

        result.IsSuccess.Should().BeTrue();
        result.Value.UserId.Should().Be(staffUser.Id);
        result.Value.GymHouseId.Should().Be(gymHouseId);
        result.Value.StaffType.Should().Be(StaffType.Trainer);
        result.Value.BaseSalary.Should().Be(5000m);
        result.Value.PerClassBonus.Should().Be(50m);
    }

    [Fact]
    public async Task CreateStaff_DuplicateUserSameGymHouse_ReturnsConflict()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();

        var (staffUser, _) = await CreateMemberAsync(gymHouseId, $"staff{Guid.NewGuid()}@example.com");

        await Sender.Send(new CreateStaffCommand(staffUser.Id, gymHouseId, StaffType.Reception, 3000m, 0m));

        var duplicate = await Sender.Send(new CreateStaffCommand(staffUser.Id, gymHouseId, StaffType.Trainer, 4000m, 30m));

        duplicate.IsFailure.Should().BeTrue();
        duplicate.Error.Should().Contain("already");
    }

    [Fact]
    public async Task CreateStaff_SameUserDifferentGymHouses_Succeeds()
    {
        var (ownerId, gymHouseId1) = await SetupOwnerAndHouseAsync();

        var (staffUser, _) = await CreateMemberAsync(gymHouseId1, $"staff{Guid.NewGuid()}@example.com");

        var house2 = await Sender.Send(new CreateGymHouseCommand("Second Gym", "456 Ave", null, null, 30));
        var gymHouseId2 = house2.Value.Id;

        var result1 = await Sender.Send(new CreateStaffCommand(staffUser.Id, gymHouseId1, StaffType.Trainer, 5000m, 50m));
        var result2 = await Sender.Send(new CreateStaffCommand(staffUser.Id, gymHouseId2, StaffType.SecurityGuard, 3000m, 0m));

        result1.IsSuccess.Should().BeTrue();
        result2.IsSuccess.Should().BeTrue();
        result1.Value.GymHouseId.Should().Be(gymHouseId1);
        result2.Value.GymHouseId.Should().Be(gymHouseId2);
    }

    [Fact]
    public async Task CreateStaff_WithoutPermission_ReturnsForbidden()
    {
        var (_, gymHouseId) = await SetupOwnerAndHouseAsync();
        CurrentUser.Permissions = Permission.None;

        var command = new CreateStaffCommand(Guid.NewGuid(), gymHouseId, StaffType.Trainer, 5000m, 50m);
        var result = await Sender.Send(command);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("Access denied");
    }
}
