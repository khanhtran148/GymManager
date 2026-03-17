# Brainstorm Report: GymManager Platform

**Date:** 2026-03-17
**Topic:** Full-platform domain design for multi-location gym management SaaS

## Summary

Brainstormed 24 ideas across 5 clusters (Domain Model, Booking, Finance, Staff/HR, Notifications) for a multi-location gym management platform. Deep research evaluated multi-tenancy approaches, financial ledger designs, and booking engine architectures. Adversarial analysis stress-tested assumptions at scale, identified 10 risks, and validated the recommended approach.

## Key Decisions

| Decision | Choice | Score |
|---|---|---|
| Multi-tenancy | Shared DB + GymHouseId + EF global filter | 8.0/10 |
| Financial ledger | Single append-only Transaction table | 7.8/10 |
| Booking engine | Unified Booking with BookingType discriminator | 7.4/10 |

## Domain Model (13 entities)

**Aggregate roots:** GymHouse, Member, Booking, ClassSchedule, Staff, Transaction
**Child entities:** Subscription, ShiftAssignment, PayrollPeriod, PayrollEntry, TimeSlot, Announcement, NotificationDelivery

## Implementation Plan

6 phases: Foundation → Booking → Finance → Staff/HR → Communications → Hardening

## Top Risks

1. Cross-tenant data leak from IgnoreQueryFilters() (R1 — Critical)
2. Mutable financial records breaking audit trail (R4 — Critical)
3. Multi-house trainer salary miscalculation (R3 — High)
4. Booking race conditions under concurrent load (R2 — High)
5. Notification spam from chain-wide announcements (R5 — Medium)

## ADR

See `docs/adrs/260317-gymmanager-platform-architecture.md`

## Full Analysis

See `docs/brainstorms/gym-management-platform-20260317-1100/brainstorm-results.md`
