using FluentAssertions;
using GymManager.Application.Roles.GetRolesMetadata;
using GymManager.Domain.Enums;
using Xunit;

namespace GymManager.Application.Tests.Roles.GetRolesMetadata;

public sealed class GetRolesMetadataQueryHandlerTests : ApplicationTestBase
{
    // ------------------------------------------------------------------ //
    // Roles
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task GetRolesMetadata_ReturnsAllFiveRoles()
    {
        var result = await Sender.Send(new GetRolesMetadataQuery());

        result.IsSuccess.Should().BeTrue();
        result.Value.Roles.Should().HaveCount(5);
        result.Value.Roles.Select(r => r.Name)
            .Should().Contain(["Owner", "HouseManager", "Trainer", "Staff", "Member"]);
    }

    [Fact]
    public async Task GetRolesMetadata_OwnerIsNotAssignable()
    {
        var result = await Sender.Send(new GetRolesMetadataQuery());

        result.IsSuccess.Should().BeTrue();
        var owner = result.Value.Roles.Single(r => r.Name == "Owner");
        owner.IsAssignable.Should().BeFalse();
    }

    [Theory]
    [InlineData("HouseManager")]
    [InlineData("Trainer")]
    [InlineData("Staff")]
    [InlineData("Member")]
    public async Task GetRolesMetadata_NonOwnerRolesAreAssignable(string roleName)
    {
        var result = await Sender.Send(new GetRolesMetadataQuery());

        result.IsSuccess.Should().BeTrue();
        var role = result.Value.Roles.Single(r => r.Name == roleName);
        role.IsAssignable.Should().BeTrue();
    }

    [Fact]
    public async Task GetRolesMetadata_RoleValuesMatchEnumIntegers()
    {
        var result = await Sender.Send(new GetRolesMetadataQuery());

        result.IsSuccess.Should().BeTrue();
        result.Value.Roles.Should().Contain(r => r.Name == "Owner" && r.Value == (int)Role.Owner);
        result.Value.Roles.Should().Contain(r => r.Name == "HouseManager" && r.Value == (int)Role.HouseManager);
        result.Value.Roles.Should().Contain(r => r.Name == "Member" && r.Value == (int)Role.Member);
    }

    // ------------------------------------------------------------------ //
    // Permissions
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task GetRolesMetadata_Returns26Permissions_ExcludingNoneAndAdmin()
    {
        var result = await Sender.Send(new GetRolesMetadataQuery());

        result.IsSuccess.Should().BeTrue();
        // Permission enum has None + Admin + 26 real permissions
        result.Value.Permissions.Should().HaveCount(26);
        result.Value.Permissions.Select(p => p.Name).Should().NotContain("None");
        result.Value.Permissions.Select(p => p.Name).Should().NotContain("Admin");
    }

    [Theory]
    [InlineData("ViewMembers",   0)]
    [InlineData("ManageMembers", 1)]
    [InlineData("ViewSubscriptions",   2)]
    [InlineData("ManageSubscriptions", 3)]
    [InlineData("ViewClasses",   4)]
    [InlineData("ManageClasses", 5)]
    [InlineData("ViewTrainers",  6)]
    [InlineData("ManageTrainers",7)]
    [InlineData("ViewPayments",  8)]
    [InlineData("ProcessPayments", 9)]
    [InlineData("ManageTenant",  10)]
    [InlineData("ViewReports",   11)]
    [InlineData("ManageBookings",12)]
    [InlineData("ViewBookings",  13)]
    [InlineData("ManageSchedule",14)]
    [InlineData("ViewSchedule",  15)]
    [InlineData("ManageFinance", 16)]
    [InlineData("ViewFinance",   17)]
    [InlineData("ManageStaff",   18)]
    [InlineData("ViewStaff",     19)]
    [InlineData("ManageAnnouncements", 20)]
    [InlineData("ViewAnnouncements",   21)]
    [InlineData("ApprovePayroll",22)]
    [InlineData("ManageShifts",  23)]
    [InlineData("ViewShifts",    24)]
    [InlineData("ManageWaitlist",25)]
    public async Task GetRolesMetadata_PermissionHasCorrectBitPosition(string permName, int expectedBit)
    {
        var result = await Sender.Send(new GetRolesMetadataQuery());

        result.IsSuccess.Should().BeTrue();
        var perm = result.Value.Permissions.Single(p => p.Name == permName);
        perm.BitPosition.Should().Be(expectedBit);
    }

    // ------------------------------------------------------------------ //
    // Permission Categories
    // ------------------------------------------------------------------ //

    [Theory]
    [InlineData("ViewMembers",         "Members")]
    [InlineData("ManageMembers",       "Members")]
    [InlineData("ViewSubscriptions",   "Subscriptions")]
    [InlineData("ManageSubscriptions", "Subscriptions")]
    [InlineData("ViewClasses",         "Classes")]
    [InlineData("ManageClasses",       "Classes")]
    [InlineData("ViewTrainers",        "Trainers")]
    [InlineData("ManageTrainers",      "Trainers")]
    [InlineData("ViewPayments",        "Payments")]
    [InlineData("ProcessPayments",     "Payments")]
    [InlineData("ManageTenant",        "Settings")]
    [InlineData("ViewReports",         "Reports")]
    [InlineData("ManageBookings",      "Bookings")]
    [InlineData("ViewBookings",        "Bookings")]
    [InlineData("ManageSchedule",      "Schedule")]
    [InlineData("ViewSchedule",        "Schedule")]
    [InlineData("ManageFinance",       "Finance")]
    [InlineData("ViewFinance",         "Finance")]
    [InlineData("ManageStaff",         "Staff")]
    [InlineData("ViewStaff",           "Staff")]
    [InlineData("ManageAnnouncements", "Announcements")]
    [InlineData("ViewAnnouncements",   "Announcements")]
    [InlineData("ApprovePayroll",      "Payroll")]
    [InlineData("ManageShifts",        "Shifts")]
    [InlineData("ViewShifts",          "Shifts")]
    [InlineData("ManageWaitlist",      "Waitlist")]
    public async Task GetRolesMetadata_PermissionHasCorrectCategory(string permName, string expectedCategory)
    {
        var result = await Sender.Send(new GetRolesMetadataQuery());

        result.IsSuccess.Should().BeTrue();
        var perm = result.Value.Permissions.Single(p => p.Name == permName);
        perm.Category.Should().Be(expectedCategory);
    }

    // ------------------------------------------------------------------ //
    // Route Access
    // ------------------------------------------------------------------ //

    [Fact]
    public async Task GetRolesMetadata_Returns17RouteAccessRules()
    {
        var result = await Sender.Send(new GetRolesMetadataQuery());

        result.IsSuccess.Should().BeTrue();
        result.Value.RouteAccess.Should().HaveCount(17);
    }

    [Theory]
    [InlineData("/settings/roles/users",  new[] { "Owner" })]
    [InlineData("/settings/roles",        new[] { "Owner" })]
    [InlineData("/settings",              new[] { "Owner" })]
    [InlineData("/finance/pnl",           new[] { "Owner", "HouseManager" })]
    [InlineData("/finance/transactions",  new[] { "Owner", "HouseManager", "Staff" })]
    [InlineData("/finance",               new[] { "Owner", "HouseManager", "Staff" })]
    [InlineData("/staff",                 new[] { "Owner", "HouseManager" })]
    [InlineData("/shifts",                new[] { "Owner", "HouseManager" })]
    [InlineData("/payroll",               new[] { "Owner", "HouseManager" })]
    [InlineData("/check-in",              new[] { "Owner", "HouseManager", "Trainer", "Staff" })]
    [InlineData("/gym-houses",            new[] { "Owner", "HouseManager", "Trainer", "Staff" })]
    [InlineData("/members",               new[] { "Owner", "HouseManager", "Trainer", "Staff", "Member" })]
    [InlineData("/bookings",              new[] { "Owner", "HouseManager", "Trainer", "Staff", "Member" })]
    [InlineData("/class-schedules",       new[] { "Owner", "HouseManager", "Trainer", "Staff", "Member" })]
    [InlineData("/time-slots",            new[] { "Owner", "HouseManager", "Trainer", "Staff", "Member" })]
    [InlineData("/announcements",         new[] { "Owner", "HouseManager", "Trainer", "Staff", "Member" })]
    [InlineData("/",                      new[] { "Owner", "HouseManager", "Trainer", "Staff", "Member" })]
    public async Task GetRolesMetadata_RouteHasCorrectAllowedRoles(string path, string[] expectedRoles)
    {
        var result = await Sender.Send(new GetRolesMetadataQuery());

        result.IsSuccess.Should().BeTrue();
        var route = result.Value.RouteAccess.Single(r => r.Path == path);
        route.AllowedRoles.Should().BeEquivalentTo(expectedRoles);
    }

    // ------------------------------------------------------------------ //
    // Auth — any authenticated user can call this
    // ------------------------------------------------------------------ //

    [Theory]
    [InlineData(Role.Owner)]
    [InlineData(Role.HouseManager)]
    [InlineData(Role.Trainer)]
    [InlineData(Role.Staff)]
    [InlineData(Role.Member)]
    public async Task GetRolesMetadata_SucceedsForAnyAuthenticatedRole(Role role)
    {
        CurrentUser.Role = role;

        var result = await Sender.Send(new GetRolesMetadataQuery());

        result.IsSuccess.Should().BeTrue();
    }
}
