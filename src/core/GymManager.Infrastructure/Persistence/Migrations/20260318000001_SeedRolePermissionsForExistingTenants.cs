using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GymManager.Infrastructure.Persistence.Migrations;

/// <summary>
/// Data migration that seeds role_permissions rows for all existing Owner users
/// (one owner per tenant). Uses ON CONFLICT DO NOTHING so it is fully idempotent.
/// Permission bitmask values match RoleSeedData.GetDefaultPermissions() at migration time.
/// </summary>
public partial class SeedRolePermissionsForExistingTenants : Migration
{
    // Bitmask constants (derived from Permission enum values at migration time).
    // Owner  = Permission.Admin = ~0L = -1 (signed 64-bit)
    // HouseManager, Trainer, Staff, Member values computed from Permission flags.
    private const long OwnerPermissions        = -1L;          // Permission.Admin
    private const long HouseManagerPermissions = 29294591L;
    private const long TrainerPermissions      = 2142229L;
    private const long StaffPermissions        = 2143007L;
    private const long MemberPermissions       = 2138133L;

    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Role enum integer values: Owner=0, HouseManager=1, Trainer=2, Staff=3, Member=4
        migrationBuilder.Sql($"""
            INSERT INTO role_permissions (tenant_id, role, permissions)
            SELECT u.id, r.role, r.default_permissions
            FROM users u
            CROSS JOIN (VALUES
                (0, {OwnerPermissions}::bigint),
                (1, {HouseManagerPermissions}::bigint),
                (2, {TrainerPermissions}::bigint),
                (3, {StaffPermissions}::bigint),
                (4, {MemberPermissions}::bigint)
            ) AS r(role, default_permissions)
            WHERE u.role = 0
              AND u.deleted_at IS NULL
            ON CONFLICT (tenant_id, role) DO NOTHING;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Down: remove all seeded rows that still match the default bitmasks.
        // Rows that were customised after seeding are left untouched.
        migrationBuilder.Sql($"""
            DELETE FROM role_permissions rp
            USING users u
            WHERE rp.tenant_id = u.id
              AND u.role = 0
              AND u.deleted_at IS NULL
              AND (rp.role, rp.permissions) IN (
                  (0, {OwnerPermissions}),
                  (1, {HouseManagerPermissions}),
                  (2, {TrainerPermissions}),
                  (3, {StaffPermissions}),
                  (4, {MemberPermissions})
              );
            """);
    }
}
