using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("role_permissions");

        builder.HasKey(rp => new { rp.TenantId, rp.Role });
        builder.Property(rp => rp.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(rp => rp.Role).HasColumnName("role").IsRequired();
        builder.Property(rp => rp.Permissions)
            .HasColumnName("permissions")
            .HasColumnType("bigint")
            .IsRequired();
    }
}
