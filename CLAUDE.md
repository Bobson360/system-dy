# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Desk-yura is a SaaS legal support platform. Lawyers create demands, AI (Claude Sonnet) analyzes them, reviewers validate the AI output, and clients see the final result.

**Demand lifecycle:** `DRAFT → ANALYZING → PENDING_REVIEW → REVIEWED / REJECTED → COMPLETED`

---

## Commands

### Backend (root)
```bash
npm run start:dev        # dev server with hot-reload (port 3000)
npm run build            # compile TypeScript
npm run lint             # ESLint --fix
npm run test             # Jest unit tests
npm run test:watch       # Jest watch mode
npm run db:migrate       # prisma migrate dev (creates migration + applies)
npm run db:migrate:prod  # prisma migrate deploy (apply only, no generation)
npm run db:studio        # Prisma Studio UI
npm run db:generate      # prisma generate (regenerate client after schema change)
```

### Frontend (`cd frontend`)
```bash
npm run dev              # Next.js dev server (port 3001)
npm run build            # production build
npm run lint             # next lint
```

### Infrastructure
```bash
# Start PostgreSQL (Docker)
docker run -d --name desk-yura-postgres --restart unless-stopped \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=desk_yura -p 5432:5432 postgres:16

docker start desk-yura-postgres   # restart stopped container
```

---

## Architecture

### Backend — NestJS (port 3000)

Entry: `src/main.ts` — boots as `NestExpressApplication`, serves `uploads/` as static at `/uploads/`, enables CORS for `localhost:3001`.

Swagger docs available at `http://localhost:3000/api/docs`.

All routes are under `/api/v1` prefix.

**Modules** (`src/modules/`):
- `auth` — JWT login/refresh/me, Passport local+JWT strategies
- `users` — CRUD base, password management
- `lawyers` — LawyerProfile management, OAB validation
- `clients` — ClientProfile CRUD; clients belong to a lawyer (tenant isolation)
- `demands` — full demand lifecycle; lawyers edit at any status
- `documents` — file upload via Multer (disk storage, UUID filenames, 20 MB limit); linked to demand **and/or** client
- `ai-analysis` — real analysis via `@anthropic-ai/sdk` + `analyzeMock()` for admin testing; tracks `durationMs` and `estimatedCostUsd`
- `review` — reviewer assigns → edits AI output → approves/rejects
- `admin` — SUPERADMIN aggregates: dashboard stats, all-demands list, trigger mock analysis
- `prisma` — singleton `PrismaService` injected everywhere
- `notifications`, `payments` — scaffolded, not yet fully implemented

**Auth & RBAC:**
- `JwtAuthGuard` + `RolesGuard` on every controller
- `@Roles(Role.X)` decorator per endpoint
- `@CurrentUser()` decorator extracts the JWT payload
- Roles: `SUPERADMIN`, `REVIEWER`, `LAWYER`, `CLIENT`

**Tenant isolation:**
- `DemandsService.findAll()` filters by `lawyerId` for LAWYER, by `clientId` for CLIENT
- `ClientsService` restricts to the lawyer's own clients

### Frontend — Next.js 14 App Router (port 3001)

**Route groups:**
- `(auth)` — public: `/login`, `/cadastro`, `/pendente`
- `(app)` — protected: layout at `(app)/layout.tsx` calls `getMe()` on mount; redirects to `/login` if unauthenticated

**Role-based routes under `(app)`:**
- `/admin/*` — SUPERADMIN: dashboard, advogados, demandas
- `/advogado/*` — LAWYER: dashboard, clientes (list/novo/[id]), demandas (list/nova/[id])
- `/revisor/*` — REVIEWER: dashboard, fila (list/[id]), historico
- `/cliente/*` — CLIENT: dashboard, demandas (list/[id])

After login, `roleRedirect(role)` in `src/lib/auth.ts` sends each role to its dashboard.

**Shared utilities (`src/lib/`):**
- `api.ts` — Axios instance, auto-injects `Bearer` token from cookies, auto-refreshes on 401, redirects to `/login` on refresh failure
- `auth.ts` — `login()`, `logout()`, `getMe()`, `isAuthenticated()`, `roleRedirect()`
- `utils.ts` — misc helpers

**Shared components (`src/components/`):**
- `dashboard/Sidebar.tsx` — role-aware nav; receives `role`, `userName`, `userEmail`
- `dashboard/Topbar.tsx` — page header with title, subtitle, optional action buttons
- `dashboard/StatusBadge.tsx` — colored badge for `DemandStatus`
- `dashboard/StatCard.tsx` — metric card for dashboards
- `dashboard/DocumentSection.tsx` — reusable upload/list/delete; props: `demandId?`, `clientId?`, `readOnly?`
- `ui/Button.tsx`, `ui/Input.tsx`, `ui/Select.tsx` — base form primitives

**Styling:** Tailwind CSS with a custom `navy-*` and `gold-*` palette defined in `tailwind.config.ts`. Dark theme throughout.

**Forms:** React Hook Form + Zod resolvers everywhere. No raw `useState` for form state.

---

## Database

Schema in `prisma/schema.prisma`. Key relationships:
- `User` 1-1 `LawyerProfile` / `ClientProfile` / `ReviewerProfile`
- `ClientProfile` belongs to `LawyerProfile` (tenant isolation)
- `Demand` belongs to both `LawyerProfile` and `ClientProfile`
- `Document` optionally linked to `Demand` and/or `ClientProfile`
- `AiAnalysis` 1-1 `Demand` (replaced on re-analysis)
- `Review` 1-1 `Demand`
- `DemandStatusLog` logs every status transition

After any schema change: `npm run db:migrate` then `npm run db:generate`.

---

## Environment

Backend `.env` (root):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/desk_yura
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ANTHROPIC_API_KEY=sk-ant-...   # required for real AI analysis
```

Frontend uses `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000/api/v1`).
