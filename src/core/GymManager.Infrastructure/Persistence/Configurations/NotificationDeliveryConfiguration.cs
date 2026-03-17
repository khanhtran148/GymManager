using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class NotificationDeliveryConfiguration : IEntityTypeConfiguration<NotificationDelivery>
{
    public void Configure(EntityTypeBuilder<NotificationDelivery> builder)
    {
        builder.ToTable("notification_deliveries");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id");
        builder.Property(d => d.AnnouncementId).HasColumnName("announcement_id").IsRequired();
        builder.Property(d => d.RecipientId).HasColumnName("recipient_id").IsRequired();
        builder.Property(d => d.Channel).HasColumnName("channel").IsRequired();
        builder.Property(d => d.Status).HasColumnName("status").IsRequired();
        builder.Property(d => d.SentAt).HasColumnName("sent_at");
        builder.Property(d => d.ReadAt).HasColumnName("read_at");
        builder.Property(d => d.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(d => d.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(d => d.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(d => d.Announcement)
            .WithMany()
            .HasForeignKey(d => d.AnnouncementId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.Recipient)
            .WithMany()
            .HasForeignKey(d => d.RecipientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => new { d.RecipientId, d.Status });
        builder.HasIndex(d => d.AnnouncementId);

        builder.HasQueryFilter(d => d.DeletedAt == null);
    }
}
