using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class ClassScheduleConfiguration : IEntityTypeConfiguration<ClassSchedule>
{
    public void Configure(EntityTypeBuilder<ClassSchedule> builder)
    {
        builder.ToTable("class_schedules");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id");
        builder.Property(c => c.GymHouseId).HasColumnName("gym_house_id").IsRequired();
        builder.Property(c => c.TrainerId).HasColumnName("trainer_id").IsRequired();
        builder.Property(c => c.ClassName).HasColumnName("class_name").HasMaxLength(200).IsRequired();
        builder.Property(c => c.DayOfWeek).HasColumnName("day_of_week").IsRequired();
        builder.Property(c => c.StartTime).HasColumnName("start_time").IsRequired();
        builder.Property(c => c.EndTime).HasColumnName("end_time").IsRequired();
        builder.Property(c => c.MaxCapacity).HasColumnName("max_capacity").IsRequired();
        builder.Property(c => c.CurrentEnrollment).HasColumnName("current_enrollment").IsRequired();
        builder.Property(c => c.IsRecurring).HasColumnName("is_recurring").IsRequired();
        builder.Property(c => c.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(c => c.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(c => c.GymHouse)
            .WithMany()
            .HasForeignKey(c => c.GymHouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Trainer)
            .WithMany()
            .HasForeignKey(c => c.TrainerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => new { c.GymHouseId, c.DayOfWeek })
            .HasDatabaseName("ix_class_schedules_gym_house_id_day_of_week");

        builder.HasQueryFilter(c => c.DeletedAt == null);
    }
}
