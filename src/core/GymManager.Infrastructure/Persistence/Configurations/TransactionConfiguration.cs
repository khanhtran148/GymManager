using GymManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GymManager.Infrastructure.Persistence.Configurations;

public sealed class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("transactions");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id");
        builder.Property(t => t.GymHouseId).HasColumnName("gym_house_id").IsRequired();
        builder.Property(t => t.TransactionType).HasColumnName("transaction_type").IsRequired();
        builder.Property(t => t.Direction).HasColumnName("direction").IsRequired();
        builder.Property(t => t.Amount).HasColumnName("amount").HasPrecision(18, 2).IsRequired();
        builder.Property(t => t.Category).HasColumnName("category").IsRequired();
        builder.Property(t => t.Description).HasColumnName("description").HasMaxLength(500).IsRequired();
        builder.Property(t => t.TransactionDate).HasColumnName("transaction_date").IsRequired();
        builder.Property(t => t.RelatedEntityId).HasColumnName("related_entity_id");
        builder.Property(t => t.ReversesTransactionId).HasColumnName("reverses_transaction_id");
        builder.Property(t => t.ReversedByTransactionId).HasColumnName("reversed_by_transaction_id");
        builder.Property(t => t.ApprovedById).HasColumnName("approved_by_id");
        builder.Property(t => t.PaymentMethod).HasColumnName("payment_method");
        builder.Property(t => t.ExternalReference).HasColumnName("external_reference").HasMaxLength(200);
        builder.Property(t => t.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(t => t.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(t => t.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(t => t.GymHouse)
            .WithMany()
            .HasForeignKey(t => t.GymHouseId)
            .OnDelete(DeleteBehavior.Restrict);

        // Self-referencing FK for reversals
        builder.HasOne(t => t.ReversesTransaction)
            .WithOne(t => t.ReversedByTransaction)
            .HasForeignKey<Transaction>(t => t.ReversesTransactionId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(t => new { t.GymHouseId, t.TransactionDate })
            .HasDatabaseName("ix_transactions_gym_house_id_transaction_date");
        builder.HasIndex(t => new { t.GymHouseId, t.TransactionType })
            .HasDatabaseName("ix_transactions_gym_house_id_transaction_type");
        builder.HasIndex(t => t.ReversesTransactionId)
            .HasDatabaseName("ix_transactions_reverses_transaction_id");

        // CRITICAL: Append-only — DO NOT apply DeletedAt IS NULL query filter.
        // DO apply GymHouseId tenant isolation via explicit filtering in queries.
        // No HasQueryFilter here.
    }
}
