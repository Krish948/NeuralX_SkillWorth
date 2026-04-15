# SkillWorth

SkillWorth is a full-stack career and finance planning web app that helps users:

- build a personal skill profile,
- discover matching jobs and career paths,
- estimate salary impact from skills,
- plan budgets and savings,
- simulate growth scenarios by adding future skills.

The app is built with React + TypeScript on the frontend and Supabase (Auth + Postgres) on the backend.

## Table of Contents

- [Project Context](#project-context)
- [Highlights](#highlights)
- [Demo Routes](#demo-routes)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [Database Setup (Supabase)](#database-setup-supabase)
- [Core Data Model](#core-data-model)
- [Testing](#testing)
- [Build and Deploy](#build-and-deploy)
- [Currency Behavior](#currency-behavior)
- [Troubleshooting](#troubleshooting)
- [Contribution Notes](#contribution-notes)

## Project Context

SkillWorth is designed for students, early professionals, and career switchers who want to make better learning and job decisions using real data.

It connects three things that are usually tracked separately:

- skill growth,
- job readiness,
- financial planning.

Typical questions this app helps answer:

- Which skills should I focus on next?
- Which roles match my current profile?
- How can new skills affect my salary potential?
- How does career growth relate to my savings goals?

Core user journey:

1. Add skills and proficiency.
2. Review match scores and career paths.
3. Track budget and financial goals.
4. Run growth simulations and compare outcomes.

## Highlights

- Responsive UI across mobile, tablet, and desktop.
- Protected authenticated app routes.
- Skill-to-salary mapping and job match scoring.
- Interactive charts for skill distribution and salary impact.
- Finance planner with expense tracking and goal progress.
- Financial growth strategy with burn-rate analysis, emergency runway tracking, debt payoff simulation, and savings milestone ladder.
- Salary and finance values displayed in INR (rupees).
- Adaptive planner for learning paths, milestones, readiness gates, and savings projection.

## Demo Routes

- Public: `/`, `/auth`
- Protected: `/dashboard`, `/skills`, `/career`, `/finance`, `/simulation`, `/planner`

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS + Radix UI + shadcn-style components
- React Router
- TanStack Query
- Recharts
- Supabase JS SDK
- Vitest + Testing Library
- ESLint

## Project Structure

```text
src/
	components/              # shared layout + UI components
	contexts/                # auth context
	data/                    # domain logic (skills mapping, scoring, salary)
	hooks/                   # data hooks (skills, jobs, finance, mobile)
	integrations/supabase/   # Supabase client + generated types
	pages/                   # route-level pages
	lib/                     # utilities (e.g. INR currency formatters)
supabase/
	migrations/              # schema + RLS policies
	seed.sql                 # seed data for skills/jobs
```

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase CLI (for local DB workflows)

## Environment Variables

Create `.env` in the project root:

```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-ref"
```

## Quick Start

```bash
npm install
npm run dev
```

Vite runs at `http://localhost:8080`.

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run build:dev` - development-mode build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run test` - run tests once
- `npm run test:watch` - run tests in watch mode

## Database Setup (Supabase)

### 1. Apply schema

```bash
supabase db push
```

### 2. Seed reference data

Use `supabase/seed.sql` to populate:

- skills catalog
- jobs catalog

This seed is written to be idempotent (safe to re-run).

## Core Data Model

Main tables created by migrations:

- `profiles`
- `skills`
- `user_skills`
- `jobs`
- `finance`

Includes:

- row-level security (RLS) policies,
- profile auto-create trigger after signup,
- ownership checks for user-scoped records.

## Testing

Run unit tests:

```bash
npm run test
```

Current test coverage includes:

- salary calculations,
- job match score logic,
- skill gap logic,
- recommendation behavior,
- route behavior baselines.

## Build and Deploy

### Build

```bash
npm run build
```

### Deploy

1. Deploy `dist/` to your static hosting platform.
2. Configure `VITE_SUPABASE_*` environment variables in hosting.
3. Ensure your Supabase project has migrations applied and seed data loaded.

## Currency Behavior

The app currently formats salary and finance values in INR.

Formatting helpers live in:

- `src/lib/currency.ts`

## Troubleshooting

- Blank page after code changes:
	Restart dev server and hard refresh browser.
- Vite/SWC parse errors:
	Check the file/line from terminal output and ensure JSX tags are balanced.
- Browserslist warning:

```bash
npx update-browserslist-db@latest
```

## Contribution Notes

- Keep business logic in `src/data` and reusable behavior in `src/hooks`.
- Add or update tests for logic changes.
- Keep Supabase types and SQL migrations in sync with schema changes.

---

If you plan to publish this repository publicly, consider adding:

- screenshots/gifs,
- a LICENSE file,
- issue and pull request templates,
- a CONTRIBUTING.md guide.
