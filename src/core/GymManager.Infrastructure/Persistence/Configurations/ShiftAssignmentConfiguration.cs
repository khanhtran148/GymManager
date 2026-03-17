using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class ShiftAssignmentConfiguration : IEntityTypeConfiguration<ShiftAssignment>
{
    public void Configure(EntityTypeBuilder<ShiftAssignment> builder)
    {
        builder.ToTable("shift_assignments");

        builder.HasKey(sa => sa.Id);
        builder.Property(sa => sa.Id).HasColumnName("id");
        builder.Property(sa => sa.StaffId).HasColumnName("staff_id").IsRequired();
        builder.Property(sa => sa.GymHouseId).HasColumnName("gym_house_id").IsRequired();
        builder.Property(sa => sa.ShiftDate).HasColumnName("shift_date").IsRequired();
        builder.Property(sa => sa.StartTime).HasColumnName("start_time").IsRequired();
        builder.Property(sa => sa.EndTime).HasColumnName("end_time").IsRequired();
        builder.Property(sa => sa.ShiftType).HasColumnName("shift_type").IsRequired();
        builder.Property(sa => sa.Status).HasColumnName("status").IsRequired();
        builder.Property(sa => sa.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(sa => sa.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(sa => sa.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(sa => sa.GymHouse)
            .WithMany()
            .HasForeignKey(sa => sa.GymHouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(sa => sa.DeletedAt == null);

        builder.HasIndex(sa => new { sa.StaffId, sa.ShiftDate })
            .HasDatabaseName("ix_shift_assignments_staff_id_shift_date");
    }
}
