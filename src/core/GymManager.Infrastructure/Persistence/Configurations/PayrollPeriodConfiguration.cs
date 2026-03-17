using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class PayrollPeriodConfiguration : IEntityTypeConfiguration<PayrollPeriod>
{
    public void Configure(EntityTypeBuilder<PayrollPeriod> builder)
    {
        builder.ToTable("payroll_periods");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasColumnName("id");
        builder.Property(p => p.GymHouseId).HasColumnName("gym_house_id").IsRequired();
        builder.Property(p => p.PeriodStart).HasColumnName("period_start").IsRequired();
        builder.Property(p => p.PeriodEnd).HasColumnName("period_end").IsRequired();
        builder.Property(p => p.Status).HasColumnName("status").IsRequired();
        builder.Property(p => p.ApprovedById).HasColumnName("approved_by_id");
        builder.Property(p => p.ApprovedAt).HasColumnName("approved_at");
        builder.Property(p => p.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(p => p.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(p => p.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(p => p.GymHouse)
            .WithMany()
            .HasForeignKey(p => p.GymHouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.Entries)
            .WithOne(e => e.PayrollPeriod)
            .HasForeignKey(e => e.PayrollPeriodId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(p => p.DeletedAt == null);

        builder.HasIndex(p => new { p.GymHouseId, p.PeriodStart })
            .HasDatabaseName("ix_payroll_periods_gym_house_id_period_start");
    }
}
