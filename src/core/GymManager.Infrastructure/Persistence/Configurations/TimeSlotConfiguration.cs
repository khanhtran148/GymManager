using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class TimeSlotConfiguration : IEntityTypeConfiguration<TimeSlot>
{
    public void Configure(EntityTypeBuilder<TimeSlot> builder)
    {
        builder.ToTable("time_slots");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id");
        builder.Property(t => t.GymHouseId).HasColumnName("gym_house_id").IsRequired();
        builder.Property(t => t.Date).HasColumnName("date").IsRequired();
        builder.Property(t => t.StartTime).HasColumnName("start_time").IsRequired();
        builder.Property(t => t.EndTime).HasColumnName("end_time").IsRequired();
        builder.Property(t => t.MaxCapacity).HasColumnName("max_capacity").IsRequired();
        builder.Property(t => t.CurrentBookings).HasColumnName("current_bookings").IsRequired();
        builder.Property(t => t.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(t => t.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(t => t.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(t => t.GymHouse)
            .WithMany()
            .HasForeignKey(t => t.GymHouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => new { t.GymHouseId, t.Date, t.StartTime })
            .HasDatabaseName("ix_time_slots_gym_house_id_date_start_time");

        builder.HasQueryFilter(t => t.DeletedAt == null);
    }
}
