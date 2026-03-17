# Discovery Context: Frontend Permission/Role Enhancement

## Requirements
- **Granularity**: Role-based for menu/page visibility, permission-based for action buttons (create, edit, delete)
- **Data source**: Decode role + permissions from JWT claims (no extra API call)
- **UX on restricted access**: Hide restricted menus from sidebar; show 403 page for direct URL access
- **5 Roles**: Owner, HouseManager, Trainer, Staff, Member
- **26 Permissions**: Bitwise flags (View/Manage pairs for each domain area)

## Current State
- Backend: Full RBAC implemented (Permission enum, IPermissionChecker, RoleSeedData role-to-permission mapping)
- Frontend: No role/permission awareness. AuthResponse lacks role/permissions. All 30 dashboard pages visible to all authenticated users. Sidebar shows all 12 nav entries unconditionally.

## Decisions
- Role determines which sidebar items and pages are visible
- Permissions determine which action buttons (Create, Edit, Delete) appear within pages
- JWT claims carry both role and permission data — frontend decodes without API call
- Hidden menus + 403 page for unauthorized direct URL access

## Tech Stack
- Next.js App Router, Zustand, TanStack Query
- JWT tokens already issued by backend
- Middleware.ts exists for auth redirect (cookie-based isAuthenticated check)
