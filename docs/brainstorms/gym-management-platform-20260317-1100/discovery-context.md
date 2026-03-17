# Discovery Context — GymManager Platform

## Business Requirements
- Multi-location gym chain management (2-5 locations, growth expected)
- Member management with subscription plans (Monthly, Quarterly, Annual, DayPass)
- Booking system: both general time-slot reservations AND trainer-led class bookings
- Financial tracking: membership fees, income, expenses, trainer salaries, staff wages, rent
- Staff/HR: trainers, security guards, cleaning staff — across multiple locations
- News/announcements with push notifications to all members and staff
- Hierarchical management: owner sees all, house managers see their own location

## Scale & Context
- 2-5 gym locations currently
- Stakeholders: gym owner (user), house managers, trainers, staff, members
- Multi-tenant by gym house, with owner as super-admin

## Preferences & Constraints
- Start with manual payment recording, add online gateway (Stripe/VNPay/Momo) later
- UI inspired by FitNexus Bootstrap theme (dark sidebar, stat cards, charts, clean dashboard)
- Tech stack: .NET 10 API, Next.js frontend, Flutter mobile, PostgreSQL, RabbitMQ, SignalR
- Architecture: Clean Architecture + CQRS, sealed classes, TFD, Result pattern

## UI Reference (FitNexus Theme)
- Dark sidebar navigation with collapsible menu
- Dashboard with stat cards (members, revenue, bookings, attendance)
- Activity charts (weekly/monthly/yearly toggles)
- Card-based layouts for classes, trainers, locations
- Notification dropdown for announcements
- Badge system for status indicators
- Responsive Bootstrap 5 grid
