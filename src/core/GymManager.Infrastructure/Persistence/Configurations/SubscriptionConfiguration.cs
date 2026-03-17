using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        builder.ToTable("subscriptions");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id");
        builder.Property(s => s.MemberId).HasColumnName("member_id").IsRequired();
        builder.Property(s => s.GymHouseId).HasColumnName("gym_house_id").IsRequired();
        builder.Property(s => s.Type).HasColumnName("type").IsRequired();
        builder.Property(s => s.Status).HasColumnName("status").IsRequired();
        builder.Property(s => s.Price).HasColumnName("price").HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(s => s.StartDate).HasColumnName("start_date").IsRequired();
        builder.Property(s => s.EndDate).HasColumnName("end_date").IsRequired();
        builder.Property(s => s.FrozenAt).HasColumnName("frozen_at");
        builder.Property(s => s.FrozenUntil).HasColumnName("frozen_until");
        builder.Property(s => s.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(s => s.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(s => s.DeletedAt).HasColumnName("deleted_at");

        builder.HasIndex(s => new { s.MemberId, s.Status });

        builder.HasQueryFilter(s => s.DeletedAt == null);
    }
}
