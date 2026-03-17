using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class WaitlistConfiguration : IEntityTypeConfiguration<Waitlist>
{
    public void Configure(EntityTypeBuilder<Waitlist> builder)
    {
        builder.ToTable("waitlists");

        builder.HasKey(w => w.Id);
        builder.Property(w => w.Id).HasColumnName("id");
        builder.Property(w => w.MemberId).HasColumnName("member_id").IsRequired();
        builder.Property(w => w.GymHouseId).HasColumnName("gym_house_id").IsRequired();
        builder.Property(w => w.BookingType).HasColumnName("booking_type").IsRequired();
        builder.Property(w => w.TimeSlotId).HasColumnName("time_slot_id");
        builder.Property(w => w.ClassScheduleId).HasColumnName("class_schedule_id");
        builder.Property(w => w.Position).HasColumnName("position").IsRequired();
        builder.Property(w => w.AddedAt).HasColumnName("added_at").IsRequired();
        builder.Property(w => w.PromotedAt).HasColumnName("promoted_at");
        builder.Property(w => w.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(w => w.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(w => w.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(w => w.Member)
            .WithMany()
            .HasForeignKey(w => w.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(w => w.GymHouse)
            .WithMany()
            .HasForeignKey(w => w.GymHouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(w => new { w.TimeSlotId, w.Position })
            .HasDatabaseName("ix_waitlists_time_slot_id_position");

        builder.HasIndex(w => new { w.ClassScheduleId, w.Position })
            .HasDatabaseName("ix_waitlists_class_schedule_id_position");

        builder.HasQueryFilter(w => w.DeletedAt == null);
    }
}
