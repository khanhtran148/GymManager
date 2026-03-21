using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class InvitationConfiguration : IEntityTypeConfiguration<Invitation>
{
    public void Configure(EntityTypeBuilder<Invitation> builder)
    {
        builder.ToTable("invitations");

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasColumnName("id");
        builder.Property(i => i.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(i => i.Email).HasColumnName("email").HasMaxLength(320).IsRequired();
        builder.Property(i => i.Role).HasColumnName("role").IsRequired();
        builder.Property(i => i.GymHouseId).HasColumnName("gym_house_id").IsRequired();
        builder.Property(i => i.Token).HasColumnName("token").HasMaxLength(100).IsRequired();
        builder.Property(i => i.ExpiresAt).HasColumnName("expires_at").IsRequired();
        builder.Property(i => i.AcceptedAt).HasColumnName("accepted_at");
        builder.Property(i => i.CreatedBy).HasColumnName("created_by").IsRequired();
        builder.Property(i => i.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(i => i.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(i => i.DeletedAt).HasColumnName("deleted_at");

        // Unique index on token for fast lookup
        builder.HasIndex(i => i.Token)
            .IsUnique()
            .HasDatabaseName("ix_invitations_token");

        // Partial unique index: only one pending invite per (email, tenant_id)
        builder.HasIndex(i => new { i.Email, i.TenantId })
            .HasFilter("accepted_at IS NULL AND deleted_at IS NULL")
            .IsUnique()
            .HasDatabaseName("ix_invitations_email_tenant_id_pending");

        // Soft delete global filter
        builder.HasQueryFilter(i => i.DeletedAt == null);

        // Defense-in-depth concurrency token using PostgreSQL's xmin system column.
        // Prevents a second SaveChanges from silently overwriting a row that was updated
        // by a concurrent request (e.g., double-accept via tracked entities).
        // xmin is a uint (uint4 in PostgreSQL) that EF Core maps as a shadow property.
        builder.Property<uint>("xmin")
            .HasColumnName("xmin")
            .HasColumnType("xid")
            .ValueGeneratedOnAddOrUpdate()
            .IsConcurrencyToken();
    }
}
