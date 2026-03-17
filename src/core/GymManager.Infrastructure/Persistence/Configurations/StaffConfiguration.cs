using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class StaffConfiguration : IEntityTypeConfiguration<Staff>
{
    public void Configure(EntityTypeBuilder<Staff> builder)
    {
        builder.ToTable("staff");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(s => s.GymHouseId).HasColumnName("gym_house_id").IsRequired();
        builder.Property(s => s.StaffType).HasColumnName("staff_type").IsRequired();
        builder.Property(s => s.BaseSalary).HasColumnName("base_salary").HasPrecision(18, 2).IsRequired();
        builder.Property(s => s.PerClassBonus).HasColumnName("per_class_bonus").HasPrecision(18, 2).IsRequired();
        builder.Property(s => s.HiredAt).HasColumnName("hired_at").IsRequired();
        builder.Property(s => s.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(s => s.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(s => s.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.GymHouse)
            .WithMany()
            .HasForeignKey(s => s.GymHouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.ShiftAssignments)
            .WithOne(sa => sa.Staff)
            .HasForeignKey(sa => sa.StaffId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(s => s.DeletedAt == null);

        builder.HasIndex(s => new { s.UserId, s.GymHouseId })
            .IsUnique()
            .HasDatabaseName("ix_staff_user_id_gym_house_id");
    }
}
