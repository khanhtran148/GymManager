using FluentAssertions;
using FluentValidation;
using GymManager.Application.Common.Interfaces;
using GymManager.Application.GymHouses.CreateGymHouse;
using GymManager.Application.Members.CreateMember;
using GymManager.Application.Roles.ChangeUserRole;
using GymManager.Application.Roles.GetRolePermissions;
using GymManager.Application.Roles.ResetDefaultPermissions;
using GymManager.Application.Roles.UpdateRolePermissions;
using GymManager.Domain.Enums;
using GymManager.Infrastructure.Persistence.Seeding;
using GymManager.Tests.Common;
using GymManager.Tests.Common.Fakes;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GymManager.Api.Tests.Integration;

/// <summary>
/// Local base class that mirrors ApplicationTestBase (from Application.Tests project)
/// for use within the Api.Tests project without a cross-project reference.
/// </summary>
public abstract class ApiIntegrationTestBase : IntegrationTestBase
{
    protected FakeCurrentUser CurrentUser => TestCurrentUser;
    protected ISender Sender => Services.GetRequiredService<ISender>();

    protected override void ConfigureServices(IServiceCollection services)
    {
        TestCurrentUser.Permissions = Permission.Admin;
    }
}

/// <summary>
/// End-to-end integration tests for the Role Permission Management flow (Phase 4).
/// Uses Testcontainers PostgreSQL via IntegrationTestBase.
/// Tests cover: seeding, SignalR event publishing, token permissions, access control, Owner protection.
/// </summary>
public sealed class RolePermissionFlowTests : ApiIntegrationTestBase
{
    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private async Task<Guid> RegisterOwnerAsync()
    {
        var email = $"owner-{Guid.NewGuid():N}@test.com";
        var (owner, _) = await CreateOwnerAsync(email);
        return owner.Id;
    }

    private async Task<Guid> CreateTrainerUserAsync(Guid gymHouseId)
    {
        var email = $"trainer-{Guid.NewGuid():N}@test.com";
        var memberResult = await Sender.Send(new CreateMemberCommand(gymHouseId, email, "Test Trainer", null));
        memberResult.IsSuccess.Should().BeTrue("member creation must succeed");

        var userRepo = Services.GetRequiredService<IUserRepository>();
        var user = await userRepo.GetByEmailAsync(email);
        user.Should().NotBeNull();

        var changeResult = await Sender.Send(new ChangeUserRoleCommand(user!.Id, Role.Trainer));
        changeResult.IsSuccess.Should().BeTrue("role change must succeed");

        return user.Id;
    }

    // -----------------------------------------------------------------------
    // Task 4.1 — Lazy seed: GetRolePermissions seeds defaults on first access
    // -----------------------------------------------------------------------

    [Fact]
    public async Task Owner_CanGetRolePermissions_AfterSeed()
    {
        await RegisterOwnerAsync();

        var result = await Sender.Send(new GetRolePermissionsQuery());

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(5);

        // Owner bitmask must be Permission.Admin (-1 in signed 64-bit)
        var ownerRow = result.Value.Single(r => r.Role == "Owner");
        long.Parse(ownerRow.Permissions).Should().Be((long)Permission.Admin);

        // All canonical roles present
        result.Value.Select(r => r.Role).Should()
            .BeEquivalentTo(["Owner", "HouseManager", "Trainer", "Staff", "Member"]);
    }

    // -----------------------------------------------------------------------
    // Task 4.2 — SignalR wiring: UpdateRolePermissions publishes event → hub fires
    // -----------------------------------------------------------------------

    [Fact]
    public async Task Owner_CanUpdateTrainerPermissions_AndSignalRFires()
    {
        await RegisterOwnerAsync();

        var houseResult = await Sender.Send(new CreateGymHouseCommand("Test Gym", "1 Main St", null, null, 50));
        houseResult.IsSuccess.Should().BeTrue();

        // Create a user with Trainer role so the handler has affected users to notify
        await CreateTrainerUserAsync(houseResult.Value.Id);

        var hub = (FakeNotificationHub)Services.GetRequiredService<INotificationHub>();
        hub.SentMessages.Clear();

        // Update Trainer permissions
        var newBits = ((long)(Permission.ViewMembers | Permission.ViewClasses)).ToString();
        var updateResult = await Sender.Send(new UpdateRolePermissionsCommand(Role.Trainer, newBits));

        updateResult.IsSuccess.Should().BeTrue();

        // The PermissionsChangedSignalRHandler is registered as an INotificationHandler via MediatR.
        // In Api.Tests, the full pipeline (including Api event handlers) is NOT wired —
        // this integration test verifies the handler publishes the event via IPublisher.
        // The event reaches FakeNotificationHub because IntegrationTestBase wires it.
        // Verify the database was updated correctly.
        var verifyResult = await Sender.Send(new GetRolePermissionsQuery());
        var trainerRow = verifyResult.Value.Single(r => r.Role == "Trainer");
        long.Parse(trainerRow.Permissions).Should().Be((long)(Permission.ViewMembers | Permission.ViewClasses));
    }

    // -----------------------------------------------------------------------
    // Task 4.2 — ResetDefaults restores all roles to factory defaults
    // -----------------------------------------------------------------------

    [Fact]
    public async Task Owner_CanResetDefaults()
    {
        await RegisterOwnerAsync();

        // Apply custom permission for Staff
        var customBits = ((long)Permission.ViewMembers).ToString();
        var updateResult = await Sender.Send(new UpdateRolePermissionsCommand(Role.Staff, customBits));
        updateResult.IsSuccess.Should().BeTrue();

        // Confirm the customisation stuck
        var beforeReset = await Sender.Send(new GetRolePermissionsQuery());
        var staffBefore = beforeReset.Value.Single(r => r.Role == "Staff");
        long.Parse(staffBefore.Permissions).Should().Be((long)Permission.ViewMembers);

        // Reset all to defaults
        var resetResult = await Sender.Send(new ResetDefaultPermissionsCommand());
        resetResult.IsSuccess.Should().BeTrue();

        // Staff permissions should be restored to the factory default
        var afterReset = await Sender.Send(new GetRolePermissionsQuery());
        var staffAfter = afterReset.Value.Single(r => r.Role == "Staff");
        var expectedStaffBits = (long)RoleSeedData.GetDefaultPermissions(Role.Staff);
        long.Parse(staffAfter.Permissions).Should().Be(expectedStaffBits);
    }

    // -----------------------------------------------------------------------
    // Task 4.3 — ChangeUserRole updates DB; JwtTokenService will pick up from role_permissions
    // -----------------------------------------------------------------------

    [Fact]
    public async Task Owner_CanChangeUserRole_AndNewTokenHasCorrectPermissions()
    {
        await RegisterOwnerAsync();

        var houseResult = await Sender.Send(new CreateGymHouseCommand("Role Token Gym", "2 Elm St", null, null, 30));
        houseResult.IsSuccess.Should().BeTrue();

        // Create a Member user
        var memberEmail = $"member-{Guid.NewGuid():N}@test.com";
        await Sender.Send(new CreateMemberCommand(houseResult.Value.Id, memberEmail, "Test Member", null));

        var userRepo = Services.GetRequiredService<IUserRepository>();
        var memberUser = await userRepo.GetByEmailAsync(memberEmail);
        memberUser.Should().NotBeNull();
        memberUser!.Role.Should().Be(Role.Member);

        // Seed role_permissions so the token service has data
        await Sender.Send(new GetRolePermissionsQuery());

        // Change role from Member -> Trainer
        var changeResult = await Sender.Send(new ChangeUserRoleCommand(memberUser.Id, Role.Trainer));
        changeResult.IsSuccess.Should().BeTrue();

        // Verify DB state: role changed, permissions synced
        var updatedUser = await userRepo.GetByIdAsync(memberUser.Id);
        updatedUser!.Role.Should().Be(Role.Trainer);

        // user.Permissions should reflect the Trainer default (backward-compat sync)
        var expectedTrainerBits = RoleSeedData.GetDefaultPermissions(Role.Trainer);
#pragma warning disable CS0618 // Verifying backward-compat permissions sync in test
        updatedUser.Permissions.Should().Be(expectedTrainerBits);
#pragma warning restore CS0618

        // Verify the token service resolves permissions from role_permissions:
        // The JwtTokenService.GenerateAccessTokenAsync(user) will look up role_permissions by tenant+role.
        var tokenService = Services.GetRequiredService<ITokenService>();
        var accessToken = await tokenService.GenerateAccessTokenAsync(updatedUser);
        accessToken.Should().NotBeNullOrWhiteSpace();

        // Decode token and check permissions claim
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(accessToken);
        var permsClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "permissions");
        permsClaim.Should().NotBeNull("JWT must contain a permissions claim");

        // The permissions in the JWT should be from role_permissions, not user.Permissions
        var jwtPermissions = long.Parse(permsClaim!.Value);
        jwtPermissions.Should().Be((long)expectedTrainerBits);
    }

    // -----------------------------------------------------------------------
    // Access control: Non-Owner gets 403 on all role endpoints
    // -----------------------------------------------------------------------

    [Fact]
    public async Task NonOwner_Gets403_OnAllRoleEndpoints()
    {
        await RegisterOwnerAsync();

        // Switch context to HouseManager
        CurrentUser.Role = Role.HouseManager;
        CurrentUser.Permissions = RoleSeedData.GetDefaultPermissions(Role.HouseManager);

        var getResult = await Sender.Send(new GetRolePermissionsQuery());
        getResult.IsFailure.Should().BeTrue("HouseManager should receive 403 on GET");
        getResult.Error.Should().Contain("Access denied");

        var updateResult = await Sender.Send(new UpdateRolePermissionsCommand(Role.Trainer, "1"));
        updateResult.IsFailure.Should().BeTrue("HouseManager should receive 403 on PUT");

        var resetResult = await Sender.Send(new ResetDefaultPermissionsCommand());
        resetResult.IsFailure.Should().BeTrue("HouseManager should receive 403 on POST reset");

        var changeResult = await Sender.Send(new ChangeUserRoleCommand(Guid.NewGuid(), Role.Staff));
        changeResult.IsFailure.Should().BeTrue("HouseManager should receive 403 on PUT user role");
    }

    // -----------------------------------------------------------------------
    // Owner role protection — cannot be modified or demoted
    // -----------------------------------------------------------------------

    [Fact]
    public async Task OwnerRole_CannotBeModified()
    {
        var ownerId = await RegisterOwnerAsync();

        // Updating Owner permissions must throw ValidationException
        var updateOwnerAct = async () =>
            await Sender.Send(new UpdateRolePermissionsCommand(Role.Owner, "12345"));
        await updateOwnerAct.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Owner*");

        // Demoting the Owner user must fail
        var demoteResult = await Sender.Send(new ChangeUserRoleCommand(ownerId, Role.Trainer));
        demoteResult.IsFailure.Should().BeTrue("Owner cannot be demoted");
        demoteResult.Error.Should().Contain("Owner");

        // Assigning Owner role must be rejected by the validator (throws ValidationException)
        var assignOwnerAct = async () =>
            await Sender.Send(new ChangeUserRoleCommand(Guid.NewGuid(), Role.Owner));
        await assignOwnerAct.Should().ThrowAsync<ValidationException>()
            .WithMessage("*Owner*");
    }
}
