# Phase 2: Core Development (4–6 weeks)

**Goal:** Ship a usable fitness PWA with auth, workout logging, mobile UI, basic analytics, and a real dashboard.

**Stack:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Supabase Auth, Drizzle ORM, PostgreSQL.

**Status legend:** `[x]` done (Phase 1 foundation) · `[ ]` not started · `[~]` in progress

---

## Timeline overview

| Week | Focus |
|------|--------|
| 1 | Auth + finish DB/ORM + user profile sync |
| 2–3 | Workout logging engine (core) |
| 4 | Frontend UI polish + mobile responsiveness |
| 5 | Basic analytics & charts |
| 6 | Dashboard integration, QA, bug fixes |

---

## 1. Authentication system

### 1.1 Supabase Auth setup
- [x] Install `@supabase/ssr` and `@supabase/supabase-js`
- [x] Create `lib/supabase/client.ts`, `server.ts`, `middleware.ts`
- [x] Root `middleware.ts` to refresh session on navigation
- [x] Configure Supabase project (email auth, redirect URLs, site URL for PWA) — see `docs/supabase-auth-setup.md`
- [x] Add auth callback route: `app/auth/callback/route.ts`
- [x] Define protected vs public route rules in middleware (redirect unauthenticated users)

### 1.2 Auth UI pages
- [x] `app/(auth)/login/page.tsx` — email magic link + Google + Apple (no signup)
- [x] Signup / forgot-password / reset-password removed (redirect to `/login`)
- [x] Shared auth layout (`app/(auth)/layout.tsx`) — centered card, no BottomNav
- [ ] Loading and error states for all auth forms
- [x] Google & Apple OAuth (`lib/auth/oauth.ts`, callback + user sync)

### 1.3 Session & client hooks
- [ ] `hooks/use-user.ts` — subscribe to auth state on the client
- [x] `hooks/use-require-auth.ts` — redirect to login when session missing
- [ ] Server-side auth helper: `lib/auth/get-session.ts` (wraps Supabase server client)

### 1.4 Profile sync (Auth ↔ Drizzle `users`)
- [x] Align `users.id` with `auth.users.id` (use Supabase user UUID, not random default)
- [x] Create/update `users` row on OAuth/email callback (`lib/auth/sync-user.ts`)
- [~] `services/auth-actions.ts` — `signOut` done; profile update in `profile-actions.ts`
- [x] Profile page: load user from DB, allow edit (username, full name, gender, height, goal)
- [x] Avatar upload to Supabase Storage + save `avatar_url`

### 1.5 Security & UX
- [x] RLS policies on Supabase tables (if using Supabase client for some reads)
- [x] Sign-out button on Profile page
- [x] Handle expired session gracefully (toast + redirect to login)
- [x] E2E smoke test: sign up → land on dashboard → sign out

---

## 2. Database schema & ORM

### 2.1 Schema (Drizzle)
- [x] Define enums: `gender`, `feeling`, `goal_type`
- [x] Tables: `users`, `exercises`, `workouts`, `workout_exercises`, `sets`, `body_measurements`
- [x] Relations between all tables
- [x] UUID primary keys with `defaultRandom()`
- [x] Review indexes (e.g. `workouts.user_id`, `workouts.date`, `workout_exercises.workout_id`)
- [x] Add `created_at` / `updated_at` timestamps where needed for auditing
- [x] Seed script: default exercise library (`drizzle/seed.ts` or SQL seed)

### 2.2 Migrations & tooling
- [x] `drizzle.config.ts` with `DATABASE_URL` (loads `.env.local`)
- [x] `lib/db/index.ts` — Drizzle client via `postgres`
- [x] npm scripts: `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`
- [ ] Run migrations on staging/production (document in README)
- [ ] CI: optional migration check or `db:push` dry-run against test DB

### 2.3 Types & data access layer
- [x] `types/index.ts` — inferred types from schema
- [ ] `lib/db/queries/users.ts` — getUserById, updateUser
- [x] `lib/db/queries/exercises.ts` — list, search, seed defaults
- [x] `lib/db/queries/workouts.ts` — list, detail, delete
- [x] `lib/db/queries/body-measurements.ts` — CRUD + latest entry
- [x] Consistent error handling for DB operations (typed results or thrown domain errors)

### 2.4 Supabase ↔ Drizzle alignment
- [x] Document connection: use Supabase Postgres `DATABASE_URL` (pooler vs direct for serverless)
- [x] Optional: link `users.id` FK to `auth.users` via Supabase SQL if enforcing at DB level

---

## 3. Workout logging engine (most complex)

### 3.1 Domain model & state
- [x] `types/workout-session.ts` — in-memory session shape (exercises, sets, timers)
- [x] `stores/workout-session-store.ts` (Zustand) — active workout state, persist to `sessionStorage`
- [x] Define session lifecycle: `idle` → `active` → `paused` → `completed` | `discarded`

### 3.2 Start & configure workout
- [x] `app/workouts/new/page.tsx` — start empty workout or from template (future)
- [x] Set title, date, optional notes before starting
- [x] `services/workout-actions.ts` — `saveCompletedWorkout`, `deleteWorkout`, `fetchExercises`

### 3.3 Exercise selection
- [x] Exercise picker modal/sheet — search by name, filter by muscle group / equipment
- [x] Add exercise to session with `order_index`
- [x] Reorder exercises (drag-and-drop or up/down controls)
- [x] Remove exercise from active session (with confirm)

### 3.4 Set logging
- [x] Per-exercise set list UI: reps, weight (kg), RPE, rest timer
- [x] Add set / duplicate previous set / delete set
- [x] Batch save sets on workout complete (`saveCompletedWorkout`)
- [x] Validate inputs (reps ≥ 0, weight ≥ 0, RPE 1–10) — client + zod schema
- [x] Rest timer component (mobile bar; haptic/audio optional — future)

### 3.5 Complete & persist workout
- [x] End workout flow: feeling selector, auto-calculate `duration` from start/end time
- [x] Transaction: insert `workouts` → `workout_exercises` → `sets` atomically
- [x] `app/workouts/[id]/page.tsx` — read-only completed workout detail
- [x] `app/workouts/page.tsx` — history list grouped by date (pagination — future)

### 3.6 Edit & delete
- [x] Edit completed workout (within reasonable time window or always)
- [x] Delete workout with confirmation (cascade sets via FK)

### 3.7 Custom exercises
- [x] Create custom exercise form (`is_custom: true`, `created_by: userId`)
- [x] Prevent duplicate names per user (app-level check; optional unique constraint)

### 3.8 Edge cases & quality
- [x] Recover abandoned session from `sessionStorage` on app reload
- [x] Offline-friendly queue (stretch): queue writes when offline, sync when online
- [x] Unit tests for session reducer / store logic
- [x] Integration test: full workout create → complete → fetch detail

---

## 4. Frontend UI + mobile responsiveness

### 4.1 Design system (shadcn/ui)
- [x] Tailwind + base `lib/utils.ts` (`cn`)
- [x] Complete shadcn init: `components.json`, theme tokens in `globals.css`
- [x] Install core components: `button`, `input`, `label`, `card`, `dialog`, `sheet`, `select`, `tabs`, `toast`, `skeleton`, `avatar`, `badge`, `separator`
- [x] Dark mode toggle (system + manual) on Profile

### 4.2 Layout & navigation
- [x] `components/layout/BottomNav.tsx` — Dashboard, Workouts, Progress, Profile
- [x] Root layout: mobile viewport, safe-area padding, BottomNav (`md:hidden`)
- [x] Route group `(app)` with shared shell (header optional on desktop)
- [x] Desktop sidebar nav (`md:flex`) mirroring BottomNav items
- [x] Active route styling consistency across nav variants

### 4.3 Reusable components
- [ ] `components/workout/ExerciseCard.tsx`
- [ ] `components/workout/SetRow.tsx`
- [ ] `components/workout/WorkoutSummary.tsx`
- [ ] `components/workout/ExercisePicker.tsx`
- [ ] `components/layout/PageHeader.tsx`
- [ ] `components/layout/EmptyState.tsx`
- [ ] `components/ui/LoadingSpinner.tsx` or skeleton patterns

### 4.4 Forms & validation
- [ ] Shared Zod schemas in `types/schemas/` (auth, profile, workout, measurements)
- [ ] react-hook-form integration pattern for all forms
- [ ] Accessible labels, focus management, keyboard-friendly set inputs

### 4.5 Mobile & PWA polish
- [x] `app/manifest.ts` + PWA via `@ducanh2912/next-pwa`
- [x] Add `public/icons/icon-192.png` and `icon-512.png`
- [x] Touch targets ≥ 44px for primary actions
- [x] Prevent layout shift during keyboard open (iOS)
- [x] `apple-touch-icon` and splash metadata in layout
- [x] Test install prompt on iOS Safari + Android Chrome (see `docs/pwa-install-testing.md`)

### 4.6 React Query setup
- [x] `app/providers.tsx` — `QueryClientProvider`
- [x] Query keys factory: `lib/query-keys.ts`
- [x] Hooks: `useWorkouts`, `useWorkout`, `useExercises`, `useBodyMeasurements`

---

## 5. Basic analytics & charts

### 5.1 Data aggregation
- [x] `lib/analytics/workout-stats.ts` — volume per week, workout count, streak
- [x] `lib/analytics/exercise-progress.ts` — estimated 1RM or max weight per exercise over time
- [x] `lib/analytics/body-stats.ts` — weight / body fat trend from `body_measurements`
- [x] Server actions or API routes to return aggregated JSON (avoid heavy client DB access)

### 5.2 Progress page UI
- [x] `app/progress/page.tsx` — tabbed layout: Workouts | Body | Exercises
- [x] Date range filter (7d / 30d / 90d / custom)
- [x] `components/analytics/VolumeChart.tsx` — weekly training volume (Recharts)
- [x] `components/analytics/WorkoutFrequencyChart.tsx` — sessions per week
- [x] `components/analytics/BodyWeightChart.tsx` — line chart from measurements
- [x] `components/analytics/ExerciseProgressChart.tsx` — pick exercise → line chart
- [x] Empty states when insufficient data

### 5.3 Body measurements
- [x] `app/progress/measurements/new/page.tsx` — log weight, body fat, circumferences (JSONB)
- [x] Measurements history list
- [x] `services/measurement-actions.ts` — create, delete (update — future)

### 5.4 Performance
- [x] Cache analytics queries (React Query `staleTime`)
- [x] Limit default chart points (aggregate by week if range > 90 days)

---

## 6. Dashboard

### 6.1 Dashboard data
- [x] `lib/analytics/dashboard-summary.ts` — combine stats for home view
- [x] Metrics: last workout, workouts this week, current streak, latest body weight
- [x] Quick actions payload (start workout, log measurement)

### 6.2 Dashboard UI
- [x] Replace placeholder `app/dashboard/page.tsx`
- [x] Greeting with user name / username
- [x] Stat cards row (responsive grid: 2 cols mobile, 4 cols desktop)
- [x] “Start workout” primary CTA (links to `/workouts/new`)
- [x] Recent workouts list (last 3–5) with link to detail
- [x] Mini chart: workouts per week (last 4 weeks)
- [x] Optional: goal progress card (`goal_type` from profile)

### 6.3 Server components & loading
- [x] Fetch dashboard data in Server Component where possible
- [x] `loading.tsx` + `error.tsx` for dashboard route
- [x] Suspense boundaries for chart sections

### 6.4 Auth gate
- [x] Redirect unauthenticated users from dashboard to login
- [x] Show skeleton dashboard while session resolves

---

## Cross-cutting tasks (all weeks)

### Testing
- [x] Add Vitest or Jest for unit tests (store, analytics utils)
- [x] Playwright smoke tests: auth + create workout flow
- [x] Manual QA checklist on real mobile devices

### CI/CD
- [x] GitHub Actions: lint, typecheck, build
- [x] Add repository secrets for Supabase env vars in CI
- [x] Optional: preview deployments (Vercel)

### Documentation
- [x] Update README: env setup, db commands, local dev, PWA install
- [x] Document workout logging user flow (for testers)

### Accessibility
- [x] Semantic HTML on all pages
- [x] ARIA labels on icon-only buttons (BottomNav done)
- [x] Color contrast check for charts and cards

---

## Definition of done (Phase 2)

- [ ] User can sign up, sign in, sign out, and edit profile
- [ ] User can start, log sets for, complete, and review a workout
- [ ] User can log body measurements and see at least one trend chart
- [ ] Dashboard shows meaningful summary and recent activity
- [ ] App is usable on mobile (375px) with BottomNav and installable as PWA
- [ ] `npm run build` passes in CI with secrets configured

---

## Phase 1 foundation (already completed)

Reference only — do not duplicate work unless gaps are found:

- [x] Next.js App Router project + TypeScript + Tailwind
- [x] PWA config (`next.config.ts`, `app/manifest.ts`, `build --webpack`)
- [x] Drizzle schema, client, migrations tooling
- [x] Supabase SSR utilities + session middleware
- [x] Folder structure: `app`, `components`, `hooks`, `lib`, `services`, `types`
- [x] Placeholder routes + mobile BottomNav
