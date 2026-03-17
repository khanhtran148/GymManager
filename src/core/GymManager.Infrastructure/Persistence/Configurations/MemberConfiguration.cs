using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> builder)
    {
        builder.ToTable("members");

        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasColumnName("id");
        builder.Property(m => m.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(m => m.GymHouseId).HasColumnName("gym_house_id").IsRequired();
        builder.Property(m => m.MemberCode).HasColumnName("member_code").HasMaxLength(50).IsRequired();
        builder.Property(m => m.Status).HasColumnName("status").IsRequired();
        builder.Property(m => m.JoinedAt).HasColumnName("joined_at").IsRequired();
        builder.Property(m => m.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(m => m.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(m => m.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(m => m.User)
            .WithMany()
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.GymHouse)
            .WithMany()
            .HasForeignKey(m => m.GymHouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(m => m.Subscriptions)
            .WithOne(s => s.Member)
            .HasForeignKey(s => s.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => new { m.GymHouseId, m.MemberCode }).IsUnique().HasFilter("deleted_at IS NULL");
        builder.HasIndex(m => m.UserId);

        builder.HasQueryFilter(m => m.DeletedAt == null);
    }
}
