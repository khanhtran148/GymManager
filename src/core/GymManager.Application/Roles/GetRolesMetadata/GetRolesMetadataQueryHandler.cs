using System.Numerics;
using CSharpFunctionalExtensions;
using GymManager.Domain.Enums;
using MediatR;

namespace GymManager.Application.Roles.GetRolesMetadata;

public sealed class GetRolesMetadataQueryHandler
    : IRequestHandler<GetRolesMetadataQuery, Result<RolesMetadataDto>>
{
    // Route access rules and the full metadata DTO are entirely static — computed once and cached.
    // SortOrder: more-specific (longer) paths first so UI can match correctly.
    private static readonly IReadOnlyList<RouteAccessDto> RouteAccessRules =
    [
        new("/settings/roles/users",  ["Owner"]),
        new("/settings/roles",        ["Owner"]),
        new("/settings",              ["Owner"]),
        new("/finance/pnl",           ["Owner", "HouseManager"]),
        new("/finance/transactions",  ["Owner", "HouseManager", "Staff"]),
        new("/finance",               ["Owner", "HouseManager", "Staff"]),
        new("/staff",                 ["Owner", "HouseManager"]),
        new("/shifts",                ["Owner", "HouseManager"]),
        new("/payroll",               ["Owner", "HouseManager"]),
        new("/check-in",              ["Owner", "HouseManager", "Trainer", "Staff"]),
        new("/gym-houses",            ["Owner", "HouseManager", "Trainer", "Staff"]),
        new("/members",               ["Owner", "HouseManager", "Trainer", "Staff", "Member"]),
        new("/bookings",              ["Owner", "HouseManager", "Trainer", "Staff", "Member"]),
        new("/class-schedules",       ["Owner", "HouseManager", "Trainer", "Staff", "Member"]),
        new("/time-slots",            ["Owner", "HouseManager", "Trainer", "Staff", "Member"]),
        new("/announcements",         ["Owner", "HouseManager", "Trainer", "Staff", "Member"]),
        new("/",                      ["Owner", "HouseManager", "Trainer", "Staff", "Member"]),
    ];

    private static readonly RolesMetadataDto CachedMetadata =
        new(BuildRoles(), BuildPermissions(), RouteAccessRules);

    public Task<Result<RolesMetadataDto>> Handle(
        GetRolesMetadataQuery request, CancellationToken ct) =>
        Task.FromResult(Result.Success(CachedMetadata));

    private static List<RoleDefinitionDto> BuildRoles() =>
        Enum.GetValues<Role>()
            .OrderBy(r => (int)r)
            .Select(r => new RoleDefinitionDto(
                Name: r.ToString(),
                Value: (int)r,
                IsAssignable: r != Role.Owner))
            .ToList();

    private static List<PermissionDefinitionDto> BuildPermissions() =>
        Enum.GetValues<Permission>()
            .Where(p => p != Permission.None && p != Permission.Admin)
            .OrderBy(p => BitPosition(p))
            .Select(p => new PermissionDefinitionDto(
                Name: p.ToString(),
                BitPosition: BitPosition(p),
                Category: DeriveCategory(p.ToString())))
            .ToList();

    /// <summary>
    /// Returns the zero-based bit position of a single-bit Permission value.
    /// Uses BitOperations.Log2 which is O(1) on all modern CPUs.
    /// </summary>
    private static int BitPosition(Permission p) =>
        BitOperations.Log2((ulong)(long)p);

    /// <summary>
    /// Derives a human-readable category from a permission enum name using
    /// naming-convention rules. Special cases take priority; the general rule
    /// strips the leading verb (View/Manage/Process/Approve) to get the subject.
    /// </summary>
    private static string DeriveCategory(string permName) => permName switch
    {
        "ManageTenant"    => "Settings",
        "ViewReports"     => "Reports",
        "ApprovePayroll"  => "Payroll",
        "ManageWaitlist"  => "Waitlist",
        "ProcessPayments" => "Payments",
        _ when permName.StartsWith("View")    => permName["View".Length..],
        _ when permName.StartsWith("Manage")  => permName["Manage".Length..],
        _ when permName.StartsWith("Approve") => permName["Approve".Length..],
        _ when permName.StartsWith("Process") => permName["Process".Length..],
        _                                      => permName
    };
}
