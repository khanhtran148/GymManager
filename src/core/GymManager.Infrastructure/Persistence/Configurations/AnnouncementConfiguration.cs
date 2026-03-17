using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class AnnouncementConfiguration : IEntityTypeConfiguration<Announcement>
{
    public void Configure(EntityTypeBuilder<Announcement> builder)
    {
        builder.ToTable("announcements");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasColumnName("id");
        builder.Property(a => a.GymHouseId).HasColumnName("gym_house_id");
        builder.Property(a => a.AuthorId).HasColumnName("author_id").IsRequired();
        builder.Property(a => a.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
        builder.Property(a => a.Content).HasColumnName("content").HasMaxLength(5000).IsRequired();
        builder.Property(a => a.TargetAudience).HasColumnName("target_audience").IsRequired();
        builder.Property(a => a.PublishAt).HasColumnName("publish_at").IsRequired();
        builder.Property(a => a.IsPublished).HasColumnName("is_published").IsRequired();
        builder.Property(a => a.PublishedAt).HasColumnName("published_at");
        builder.Property(a => a.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(a => a.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(a => a.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(a => a.Author)
            .WithMany()
            .HasForeignKey(a => a.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Chain-wide: GymHouseId is NULL — no FK to GymHouse for null case
        builder.HasIndex(a => new { a.GymHouseId, a.PublishAt });

        // Index for Quartz publisher job: filters on IsPublished + PublishAt
        builder.HasIndex(a => new { a.IsPublished, a.PublishAt });

        builder.HasQueryFilter(a => a.DeletedAt == null);
    }
}
