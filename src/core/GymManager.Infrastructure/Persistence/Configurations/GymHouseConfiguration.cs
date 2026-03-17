using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class GymHouseConfiguration : IEntityTypeConfiguration<GymHouse>
{
    public void Configure(EntityTypeBuilder<GymHouse> builder)
    {
        builder.ToTable("gym_houses");

        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).HasColumnName("id");
        builder.Property(g => g.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(g => g.Address).HasColumnName("address").HasMaxLength(500).IsRequired();
        builder.Property(g => g.Phone).HasColumnName("phone").HasMaxLength(50);
        builder.Property(g => g.OperatingHours).HasColumnName("operating_hours").HasColumnType("text");
        builder.Property(g => g.HourlyCapacity).HasColumnName("hourly_capacity").IsRequired();
        builder.Property(g => g.OwnerId).HasColumnName("owner_id").IsRequired();
        builder.Property(g => g.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(g => g.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(g => g.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(g => g.Owner)
            .WithMany()
            .HasForeignKey(g => g.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(g => g.OwnerId);
        builder.HasQueryFilter(g => g.DeletedAt == null);
    }
}
