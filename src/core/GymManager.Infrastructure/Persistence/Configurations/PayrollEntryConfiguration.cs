using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class PayrollEntryConfiguration : IEntityTypeConfiguration<PayrollEntry>
{
    public void Configure(EntityTypeBuilder<PayrollEntry> builder)
    {
        builder.ToTable("payroll_entries");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.PayrollPeriodId).HasColumnName("payroll_period_id").IsRequired();
        builder.Property(e => e.StaffId).HasColumnName("staff_id").IsRequired();
        builder.Property(e => e.BasePay).HasColumnName("base_pay").HasPrecision(18, 2).IsRequired();
        builder.Property(e => e.ClassBonus).HasColumnName("class_bonus").HasPrecision(18, 2).IsRequired();
        builder.Property(e => e.Deductions).HasColumnName("deductions").HasPrecision(18, 2).IsRequired();
        builder.Property(e => e.NetPay).HasColumnName("net_pay").HasPrecision(18, 2).IsRequired();
        builder.Property(e => e.ClassesTaught).HasColumnName("classes_taught").IsRequired();
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(e => e.Staff)
            .WithMany()
            .HasForeignKey(e => e.StaffId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(e => e.DeletedAt == null);

        builder.HasIndex(e => e.PayrollPeriodId)
            .HasDatabaseName("ix_payroll_entries_payroll_period_id");
    }
}
