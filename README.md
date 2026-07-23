# TaskFlow — Task Management App

A clean, production-quality task management web app built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, and **Supabase**. Every user signs up, logs in, and manages a private list of tasks that stays in sync in real time across tabs and devices.

## Overview

TaskFlow lets an authenticated user create, read, update, and delete personal tasks with a status (`To Do`, `In Progress`, `Completed`), priority (`Low`, `Medium`, `High`), and due date. Data is stored in Postgres via Supabase, access is enforced with Row Level Security so users can only ever see their own rows, and changes propagate instantly through Supabase Realtime — no manual refreshing required.

## Features

- **Authentication** — email/password sign up, log in, log out via Supabase Auth. Sessions persist across reloads and are refreshed automatically by middleware.
- **Protected routes** — `/dashboard` and `/tasks` require a session; unauthenticated visitors are redirected to `/login` (enforced in middleware and again in the server layout).
- **Full CRUD** — create, edit, and delete tasks, with a confirmation dialog before delete.
- **Status workflow** — change a task's status inline from a dropdown on each row.
- **Realtime sync** — inserts, updates, and deletes made in any tab/device appear immediately, powered by `postgres_changes` subscriptions on the `tasks` table.
- **Dashboard** — welcome banner and stat cards (Total, To Do, In Progress, Completed) plus a preview of recent tasks.
- **Search, filter, sort** — search by title, filter by status/priority, and sort by newest, oldest, due date, or priority.
- **Validation & error handling** — required-field validation on all forms, friendly error messages for auth/database/network failures, and toast notifications for success/error feedback.
- **Loading & empty states** — spinners while data loads, disabled/loading buttons during submits, and empty-state messaging when there's nothing to show.
- **Responsive UI** — a collapsible sidebar on mobile, fixed sidebar on desktop, and a responsive task layout.

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router, Server Components, Middleware)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) — Postgres database, Auth, and Realtime
- `@supabase/supabase-js` + `@supabase/ssr` (official SDKs, used directly — no ORM)
- ESLint

## Project Structure

```
src/
  app/                    Routes (App Router)
    (app)/                Protected route group — sidebar/top nav shell
      dashboard/          Dashboard page
      tasks/              Tasks page
    auth/callback/        Email-confirmation redirect handler
    login/, signup/       Public auth pages
    page.tsx              Redirects to /dashboard or /login
  middleware.ts           Session refresh + route protection
  components/
    auth/                 Login/signup forms, logout button, auth provider
    dashboard/             Welcome banner, stat cards
    tasks/                 Filters, form modal, list, item, badges
    layout/                Sidebar, top nav, app shell
    ui/                    Reusable primitives (Button, Input, Modal, Toast, ...)
  hooks/                  useAuth, useTasks, useToast
  services/               tasks.ts — thin data-access layer over the Supabase client
  lib/supabase/           Browser/server/middleware Supabase client factories
  types/                  Task and Database (Supabase) TypeScript types
  utils/                  cn, date formatting, form validation
supabase/
  schema.sql              Table, indexes, RLS policies, realtime publication
```

## Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com/) project

## 1. Manual setup: create a Supabase project

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. Open **SQL Editor** and run the entire contents of [`supabase/schema.sql`](supabase/schema.sql). This creates the `tasks` table, indexes, `updated_at` trigger, Row Level Security policies, and adds `tasks` to the `supabase_realtime` publication.
3. Open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key
4. Open **Authentication → URL Configuration** and add:
   - Site URL: `http://localhost:3000` (and your production URL once deployed)
   - Redirect URLs: `http://localhost:3000/auth/callback` (and the production equivalent)
   - The Email provider is enabled by default — no extra setup needed for email/password auth. (Optional: disable "Confirm email" under **Authentication → Providers → Email** for instant sign-in during local testing.)

## 2. Environment variables

Copy the example file and fill in the values from step 1:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Both are safe to expose to the browser (`NEXT_PUBLIC_*`) — access control is enforced server-side by Postgres Row Level Security, not by hiding the key.

## 3. Install and run locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login` — use **Sign up** to create an account, then log in.

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # ESLint
```

## Authentication

- `src/lib/supabase/client.ts` creates a browser Supabase client for use in Client Components (forms, hooks).
- `src/lib/supabase/server.ts` creates a server Supabase client for Server Components/Route Handlers, reading/writing the session via Next.js cookies.
- `src/middleware.ts` + `src/lib/supabase/middleware.ts` refresh the session on every request and redirect unauthenticated users away from `/dashboard` and `/tasks`, and authenticated users away from `/login`/`/signup`.
- `src/app/(app)/layout.tsx` re-checks the session server-side before rendering any protected page (defense in depth beyond middleware).
- `src/components/auth/AuthProvider.tsx` keeps a client-side auth context in sync via `onAuthStateChange`, so a sign-out in one tab immediately reflects in others.
- Sign up uses `supabase.auth.signUp`; if your project has "Confirm email" enabled, the user is shown a "check your email" message and the link routes through `src/app/auth/callback/route.ts`, which exchanges the code for a session.

## Realtime

Each task list (`src/hooks/useTasks.ts`) opens a Supabase Realtime channel scoped to the current user:

```ts
supabase
  .channel(`tasks-changes-${userId}`)
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
    handleChange
  )
  .subscribe();
```

`handleChange` merges `INSERT`/`UPDATE`/`DELETE` payloads into local state, so the task list, filters, and dashboard stats all update live without a page refresh — whether the change came from this tab, another tab, or another device signed into the same account. The channel is removed (`supabase.removeChannel`) in the hook's cleanup function whenever the component unmounts or the user changes, preventing leaked subscriptions. This is all handled by Supabase's hosted Realtime service — no custom WebSocket server is run, which keeps the app fully compatible with Vercel's serverless deployment model.

## Database & Security

See [`supabase/schema.sql`](supabase/schema.sql) for the full definition. Summary:

- `tasks` table: `id`, `user_id`, `title`, `description`, `status` (enum), `priority` (enum), `due_date`, `created_at`, `updated_at`.
- Indexes on `user_id` and common filter/sort columns (`status`, `priority`, `due_date`, `created_at`).
- A trigger keeps `updated_at` current on every update.
- **Row Level Security is enabled**, with `select`/`insert`/`update`/`delete` policies that all require `auth.uid() = user_id` — a user can only ever read or modify their own tasks, enforced by Postgres itself regardless of what the client sends.

## Deployment (Vercel)

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. Import the project into [Vercel](https://vercel.com/new).
3. Add the environment variables from step 2 in **Project Settings → Environment Variables**.
4. Deploy. No further configuration is needed — the app is a standard Next.js App Router project with no custom server, so it runs entirely on Vercel's serverless/edge runtime.
5. Back in Supabase, add your production URL to **Authentication → URL Configuration** (Site URL and Redirect URLs, e.g. `https://your-app.vercel.app/auth/callback`).

## Notes

- Do not use Prisma or any additional ORM — all database access goes through the Supabase JS SDK directly, respecting RLS.
- No custom WebSocket server is implemented; all realtime behavior comes from Supabase Realtime.
