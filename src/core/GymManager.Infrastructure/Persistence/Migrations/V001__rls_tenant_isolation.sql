-- ============================================================
-- Migration V001: Row-Level Security — Tenant Isolation
-- Applies to all 13 tenant-scoped tables.
-- This migration MUST be run by a superuser or the table owner.
-- After applying, all DML from application connections is filtered
-- by app.current_tenant_id (set by TenantConnectionInterceptor).
-- FORCE ROW LEVEL SECURITY ensures the policy also applies to
-- the table owner role (except PostgreSQL superusers).
-- ============================================================

-- members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE members FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON members;
CREATE POLICY tenant_isolation ON members
    USING (gym_house_id = current_setting('app.current_tenant_id', true)::uuid);

-- subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON subscriptions;
CREATE POLICY tenant_isolation ON subscriptions
    USING (gym_house_id = current_setting('app.current_tenant_id', true)::uuid);

-- time_slots
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON time_slots;
CREATE POLICY tenant_isolation ON time_slots
    USING (gym_house_id = current_setting('app.current_tenant_id', true)::uuid);

-- class_schedules
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON class_schedules;
CREATE POLICY tenant_isolation ON class_schedules
    USING (gym_house_id = current_setting('app.current_tenant_id', true)::uuid);

-- bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON bookings;
CREATE POLICY tenant_isolation ON bookings
    USING (gym_house_id = current_setting('app.current_tenant_id', true)::uuid);

-- waitlists
ALTER TABLE waitlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlists FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON waitlists;
CREATE POLICY tenant_isolation ON waitlists
    USING (gym_house_id = current_setting('app.current_tenant_id', true)::uuid);

-- transactions (no soft-delete filter — explicit tenant filter critical here)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON transactions;
CREATE POLICY tenant_isolation ON transactions
    USING (gym_house_id = current_setting('app.current_tenant_id', true)::uuid);

-- staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON staff;
CREATE POLICY tenant_isolation ON staff
    USING (gym_house_id = current_setting('app.current_tenant_id', true)::uuid);

-- shift_assignments
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON shift_assignments;
CREATE POLICY tenant_isolation ON shift_assignments
    USING (gym_house_id = current_setting('app.current_tenant_id', true)::uuid);

-- payroll_periods
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON payroll_periods;
CREATE POLICY tenant_isolation ON payroll_periods
    USING (gym_house_id = current_setting('app.current_tenant_id', true)::uuid);

-- payroll_entries: no gym_house_id column — isolated via payroll_period FK
-- RLS on payroll_entries uses payroll_period_id subquery for tenant check
ALTER TABLE payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_entries FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON payroll_entries;
CREATE POLICY tenant_isolation ON payroll_entries
    USING (
        payroll_period_id IN (
            SELECT id FROM payroll_periods
            WHERE gym_house_id = current_setting('app.current_tenant_id', true)::uuid
        )
    );

-- announcements: gym_house_id can be NULL (platform-wide announcements)
-- When NULL, the announcement is visible to all tenants
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON announcements;
CREATE POLICY tenant_isolation ON announcements
    USING (
        gym_house_id IS NULL
        OR gym_house_id = current_setting('app.current_tenant_id', true)::uuid
    );

-- notification_deliveries: no gym_house_id — isolated via announcement FK
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON notification_deliveries;
CREATE POLICY tenant_isolation ON notification_deliveries
    USING (
        announcement_id IN (
            SELECT id FROM announcements
            WHERE gym_house_id IS NULL
               OR gym_house_id = current_setting('app.current_tenant_id', true)::uuid
        )
    );
