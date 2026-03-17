using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.ToTable("bookings");

        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasColumnName("id");
        builder.Property(b => b.MemberId).HasColumnName("member_id").IsRequired();
        builder.Property(b => b.GymHouseId).HasColumnName("gym_house_id").IsRequired();
        builder.Property(b => b.BookingType).HasColumnName("booking_type").IsRequired();
        builder.Property(b => b.TimeSlotId).HasColumnName("time_slot_id");
        builder.Property(b => b.ClassScheduleId).HasColumnName("class_schedule_id");
        builder.Property(b => b.Status).HasColumnName("status").IsRequired();
        builder.Property(b => b.BookedAt).HasColumnName("booked_at").IsRequired();
        builder.Property(b => b.CheckedInAt).HasColumnName("checked_in_at");
        builder.Property(b => b.CheckInSource).HasColumnName("check_in_source");
        builder.Property(b => b.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(b => b.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(b => b.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(b => b.Member)
            .WithMany()
            .HasForeignKey(b => b.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.GymHouse)
            .WithMany()
            .HasForeignKey(b => b.GymHouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.TimeSlot)
            .WithMany()
            .HasForeignKey(b => b.TimeSlotId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.ClassSchedule)
            .WithMany()
            .HasForeignKey(b => b.ClassScheduleId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(b => new { b.MemberId, b.Status })
            .HasDatabaseName("ix_bookings_member_id_status");

        builder.HasIndex(b => new { b.GymHouseId, b.BookedAt })
            .HasDatabaseName("ix_bookings_gym_house_id_booked_at");

        builder.HasIndex(b => b.TimeSlotId)
            .HasDatabaseName("ix_bookings_time_slot_id");

        builder.HasIndex(b => b.ClassScheduleId)
            .HasDatabaseName("ix_bookings_class_schedule_id");

        builder.HasQueryFilter(b => b.DeletedAt == null);
    }
}
