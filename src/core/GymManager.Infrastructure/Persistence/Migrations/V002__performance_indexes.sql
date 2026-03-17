-- ============================================================
-- Migration V002: Performance Indexes
-- Adds composite and covering indexes for P&L, revenue metrics,
-- and concurrency-sensitive queries.
-- ============================================================

-- bookings: composite index for slot-level capacity checks
-- Used by CreateBooking handler to count confirmed bookings per slot
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_bookings_gym_house_id_time_slot_id_status
    ON bookings (gym_house_id, time_slot_id, status)
    WHERE deleted_at IS NULL;

-- transactions: covering index for P&L and revenue metrics queries
-- INCLUDE avoids heap fetches for the most common aggregate columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_transactions_gym_house_id_transaction_date_covering
    ON transactions (gym_house_id, transaction_date)
    INCLUDE (direction, category, amount);

-- members: status filter for active membership queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_members_gym_house_id_status
    ON members (gym_house_id, status)
    WHERE deleted_at IS NULL;

-- ============================================================
-- Audit notes:
-- ix_shift_assignments_staff_id_shift_date — already created by ShiftAssignmentConfiguration
-- ix_notification_deliveries_recipient_id_status (recipient_id, status) — already created by NotificationDeliveryConfiguration
-- ix_transactions_gym_house_id_transaction_date — already created by TransactionConfiguration (without INCLUDE)
--   The covering index above supersedes it for aggregate queries; original retained for point lookups
-- ============================================================
