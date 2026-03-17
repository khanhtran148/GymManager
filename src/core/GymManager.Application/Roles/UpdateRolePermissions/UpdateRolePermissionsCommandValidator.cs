using FluentValidation;
using GymManager.Domain.Enums;

namespace GymManager.Application.Roles.UpdateRolePermissions;

public sealed class UpdateRolePermissionsCommandValidator : AbstractValidator<UpdateRolePermissionsCommand>
{
    /// <summary>
    /// The OR of all individually defined Permission values (excludes None and Admin sentinel).
    /// Any bitmask with bits set outside this mask contains undefined permission bits.
    /// </summary>
    private static readonly long AllValidPermissionBits = ComputeAllValidBits();

    public UpdateRolePermissionsCommandValidator()
    {
        RuleFor(x => x.Role)
            .Must(r => r != Role.Owner)
            .WithMessage("Owner role permissions cannot be modified.");

        RuleFor(x => x.Permissions)
            .NotEmpty().WithMessage("Permissions bitmask is required.")
            .Must(p => long.TryParse(p, out _))
            .WithMessage("Permissions must be a valid numeric bitmask.")
            .Must(p => long.TryParse(p, out var bits) && (bits & ~AllValidPermissionBits) == 0)
            .WithMessage("Permissions bitmask contains undefined permission bits.");
    }

    private static long ComputeAllValidBits()
    {
        // Aggregate all defined named permissions, excluding None (0) and Admin (~0L which is all bits)
        long valid = 0L;
        foreach (var value in Enum.GetValues<Permission>())
        {
            if (value is Permission.None or Permission.Admin)
                continue;

            valid |= (long)value;
        }
        return valid;
    }
}
