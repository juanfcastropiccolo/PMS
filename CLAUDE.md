# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Parkit PMS — a parking management system (Property Management System) for parking lot owners. Built with Next.js 14 App Router, MUI v5, Supabase (PostgreSQL + Auth), and TypeScript. The UI and codebase are in **Spanish**.

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint (next/core-web-vitals + prettier)
npm run type-check   # TypeScript type checking (tsc --noEmit)
npm run test         # Jest (configured but no test files yet)
```

## Architecture

### Routing & Pages
- **Next.js App Router** with file-based routing under `src/app/`
- `/auth/*` — Public auth pages (login, register, reset-password)
- `/dashboard/*` — Protected owner dashboard (estacionamientos, reservas, ingresos, cobros, resenas, perfil)
- `/admin/*` — Admin panel (planned, route-protected by middleware)
- `/api/*` — Server-side API routes (e.g., `/api/auth/check-role`)

### Authentication & Authorization (4-layer security)
1. `src/lib/auth/authService.ts` — Supabase auth calls (signIn, signUp, logout)
2. `src/contexts/AuthContext.tsx` — React context providing `useAuth()` hook; blocks access if no roles
3. `src/middleware.ts` — Next.js middleware; checks session, protects `/admin/*` routes
4. `src/app/api/auth/check-role/route.ts` — API route using **service role key** to bypass RLS and fetch `user_roles`

Roles: `propietario`, `admin`, `super_admin` (stored in `user_roles` table).

### Data Layer
- **Supabase client** (`src/lib/supabase.ts`, `src/lib/supabaseClient.ts`) — direct queries via `supabase.from().select().eq()`
- No ORM — raw Supabase query builder
- **RLS** (Row Level Security) policies enforce access at the database level
- Service role key used only in API routes to bypass RLS
- Database types generated in `src/types/database.ts`
- SQL migrations in `sql_scripts/` (symbiosis pattern — shares DB with mobile app)

### Key Tables
- `estacionamientos` — Parking lots (owner, capacity, pricing, verification status)
- `reservas_estacionamiento` — Bookings with state machine (pendiente → confirmada → en_curso → completada/cancelada/no_show)
- `user_roles` — RBAC with JSONB permissions
- `fotos_estacionamiento`, `resenas`, `notificaciones`, `audit_log`, `kyc_submissions`

### Styling & Theme
- MUI v5 with custom theme in `src/lib/theme.ts`
- Primary: `#0077B6`, Secondary: `#023E8A`, Accent: `#90E0EF`
- All components use MUI's `sx` prop and theme tokens

### Path Alias
`@/*` maps to `./src/*` (configured in tsconfig.json).

### Code Style
- Prettier: single quotes, semicolons, trailing commas (es5), 100 char width, 2-space indent
- ESLint warnings for `any` types and unused vars (underscore-prefixed ignored)

## Environment Variables

Required in `.env`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, plus optional Mercado Pago (`MP_*`) and Google Places (`NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`) keys.
