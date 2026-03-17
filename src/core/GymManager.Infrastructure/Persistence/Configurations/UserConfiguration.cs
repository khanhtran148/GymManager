using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasColumnName("id");
        builder.Property(u => u.Email).HasColumnName("email").HasMaxLength(320).IsRequired();
        builder.Property(u => u.PasswordHash).HasColumnName("password_hash").IsRequired();
        builder.Property(u => u.FullName).HasColumnName("full_name").HasMaxLength(200).IsRequired();
        builder.Property(u => u.Phone).HasColumnName("phone").HasMaxLength(50);
        builder.Property(u => u.Role).HasColumnName("role").IsRequired();
        builder.Property(u => u.Permissions).HasColumnName("permissions").HasColumnType("bigint").IsRequired();
        builder.Property(u => u.RefreshToken).HasColumnName("refresh_token");
        builder.Property(u => u.RefreshTokenExpiresAt).HasColumnName("refresh_token_expires_at");
        builder.Property(u => u.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(u => u.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(u => u.DeletedAt).HasColumnName("deleted_at");

        builder.HasIndex(u => u.Email).IsUnique().HasFilter("deleted_at IS NULL");
    }
}
