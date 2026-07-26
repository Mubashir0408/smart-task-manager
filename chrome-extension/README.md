# TaskFlow Quick Add — Chrome Extension

A Manifest V3 companion extension for the TaskFlow task management app. It
lets a signed-in user create a task and glance at their 5 most recent tasks
from the browser toolbar, without opening the full dashboard.

This extension is fully self-contained inside `chrome-extension/`. It does
not modify, wrap, or depend on any file elsewhere in the repository — the
Next.js app, its authentication, database schema, and existing features are
untouched.

## Project structure

```
chrome-extension/
├── manifest.json     # MV3 manifest: permissions, popup, icons
├── config.js         # Supabase URL / anon key / dashboard URL (edit these)
├── utils.js          # Shared: email validation, config check, safeFetch() error classification
├── auth.js           # Sign in / sign out / session refresh (Supabase Auth REST API)
├── api.js            # Fetch recent tasks / create a task (Supabase PostgREST API)
├── popup.html         # Popup markup (~380px wide)
├── popup.css          # Popup styling
├── popup.js           # Popup UI logic — wires the DOM to auth.js / api.js
├── icons/
│   ├── icon16.png     # Placeholder icons (solid color + "+" mark)
│   ├── icon48.png     # Replace with real branded icons any time —
│   └── icon128.png    # same filenames, same sizes.
└── README.md
```

Scripts are loaded as plain `<script>` tags in `popup.html`, in dependency
order (`config.js` → `utils.js` → `auth.js` → `api.js` → `popup.js`). There is
no bundler and no build step — this keeps the extension MV3-CSP-friendly (no
remote or compiled code) and free of any new npm dependencies.

## Error handling

Every request in `auth.js`/`api.js` goes through `safeFetch()` in `utils.js`,
which classifies failures into a `.kind` on the thrown `Error` *before* they
ever reach the UI:

| `kind`                  | Meaning                                                | Shown to the user |
|-------------------------|---------------------------------------------------------|--------------------|
| `config`                 | `config.js` still has placeholder values                 | "Invalid configuration…" |
| `offline`                 | `navigator.onLine` is false                              | "No internet connection…" |
| `network`                 | `fetch()` itself threw (DNS/CORS/refused)                | "Cannot reach Supabase…" |
| `invalid_credentials`     | Supabase `error_code: invalid_credentials`, an unrecognized 4xx, or an expired session | "Invalid email or password." / "Your session expired…" |
| `email_not_confirmed`     | Supabase `error_code: email_not_confirmed`               | "Email not confirmed. Check your inbox…" |
| `user_banned` / `user_not_found` / rate-limit codes | Other specific Supabase Auth `error_code`s | See `AUTH_ERROR_MESSAGES` in `utils.js` |
| `server`                  | Any other non-OK HTTP response (5xx, etc.)               | "Unexpected server error…" |

Login/refresh failures are classified by `describeAuthError()` in `utils.js`,
which reads Supabase's `error_code` field — **not just the HTTP status** —
since Supabase returns `400` for many distinct auth failures (bad password,
unconfirmed email, rate limiting, …) and collapsing them all into "Invalid
email or password." hides the real problem. The full (password/token-free)
error body is also logged to the console via `console.error` for debugging.

`popup.js` never has to parse a raw fetch error — it just displays
`err.message`, and on `invalid_credentials` from an authenticated request
(task creation/fetch) it also signs the user out and returns to the sign-in
view. Every async handler in `popup.js` uses `try/catch/finally`, so loading
indicators and disabled buttons always reset, even on failure.

## Performance: stale-while-revalidate startup

A popup context is torn down when closed, so every open pays a *cold*
network round-trip to Supabase (TLS handshake + request — commonly
0.5–2s, measured against this project). The popup does not make the user
wait on that:

1. `init()` reads the stored session via `Auth.getSession()` — a
   `chrome.storage.local` read only, no network, resolves in a few ms.
2. If a session is cached, `showAppView()` renders it **immediately**,
   along with any cached task list from `TasksApi.getCachedTasks()` (also
   local-only) — the popup is fully interactive before any network request
   has even started.
3. `syncInBackground()` then validates/refreshes the session and fetches
   fresh tasks *after* the UI is already showing something, via
   `TasksApi.fetchRecentTasks()`, which re-caches the result for next time.
4. If there's nothing cached yet (first-ever load), a shimmering skeleton
   (`renderSkeleton()` / `.skeleton-bar` in `popup.css`) shows instead of a
   blocking spinner, and is replaced once real data arrives.
5. A background refresh that fails doesn't clear cached data already on
   screen — it's logged to the console and the user keeps looking at
   still-valid cached tasks (only shown as an error if there was nothing
   cached to fall back on).

This also removes a redundant `Auth.getValidSession()` call that the
previous version made twice on every startup (once in `init()`, once again
inside the recent-tasks loader) — `loadRecentTasks(session)` now accepts an
already-validated session and only re-validates when one isn't supplied
(explicit refresh-button click, task creation).

Every phase is individually timed via `perfLog()` in `utils.js` and logged
to the popup's own console (right-click the extension icon → **Inspect
popup**) under the `[TaskFlow][perf]` prefix: session retrieval,
authentication check, each Supabase request, and rendering.

The tasks REST request already selected only the columns the popup renders
(`id,title,status,priority,created_at`, never `select=*`) and capped the
result at 5 rows (`limit=5`) — both unchanged, just confirmed here since
they're part of the same performance story.

## How the popup works

`popup.js` is a small state machine over two views defined in `popup.html`:

1. **Sign-in view** (`#loginSection`) — shown when there is no valid stored
   Supabase session. Collects email + password.
2. **Task view** (`#appSection`) — shown once signed in. Contains the quick
   task-creation form (Title, Description, Status) and the Recent Tasks
   list, plus a "Sign out" and an "Open Dashboard" button.

On open, the popup shows a loading indicator while it checks
`chrome.storage.local` for a session (`init()` in `popup.js`), then renders
whichever view applies. Success and error feedback is shown via a single
banner element at the top of the popup; the Create Task button disables
itself and shows a spinner while a request is in flight.

> **Note on the Status field:** the task's database schema
> (`supabase/schema.sql`) has two separate enums — `task_status`
> (`todo` / `in_progress` / `completed`) and `task_priority`
> (`low` / `medium` / `high`). The three values requested for the popup's
> dropdown (Todo / In Progress / Completed) are the `task_status` values, so
> the popup's dropdown is labeled **Status** and writes to the `status`
> column; `priority` defaults to `medium` (matching the app's own default)
> to keep the popup minimal. Priority can be changed later from the full
> dashboard.

## How data flows

The extension does **not** call any Next.js API route, and none needed to be
added — the existing app talks to Supabase directly from the browser
(see `src/services/tasks.ts`, which calls `supabase.from("tasks")`), and the
extension does the same thing over plain `fetch()`:

- **Sign in** → `POST {SUPABASE_URL}/auth/v1/token?grant_type=password`
  (Supabase Auth REST API — the same endpoint `supabase.auth.signInWithPassword`
  calls internally in `src/components/auth/LoginForm.tsx`).
- **Read recent tasks** → `GET {SUPABASE_URL}/rest/v1/tasks?select=...&order=created_at.desc&limit=5`
  (Supabase's auto-generated PostgREST API for the `tasks` table).
- **Create a task** → `POST {SUPABASE_URL}/rest/v1/tasks` with the same
  field defaults/trimming as `createTask()` in `src/services/tasks.ts`.

Every request is sent with the signed-in user's own access token
(`Authorization: Bearer <access_token>`), so the table's existing Row Level
Security policies — `auth.uid() = user_id` — decide what can be read or
written, exactly as they do for the web app. No business logic is
duplicated; the database is the single source of truth for both clients.

### Why not reuse the app's login session directly?

The extension popup runs on a `chrome-extension://` origin, separate from
the web app's domain, so it cannot read the app's httpOnly session cookies.
Instead it establishes its own Supabase session (same project, same users
table) and stores it in `chrome.storage.local`. Access tokens are refreshed
automatically (`Auth.getValidSession()` in `auth.js`) using the stored
refresh token when they're near expiry.

## How recent tasks are loaded

On popup open, cached tasks (if any) render instantly — see
[Performance](#performance-stale-while-revalidate-startup) above. After
sign-in, after every successful task creation, on a background sync, and
when the refresh (⟳) button is clicked, `loadRecentTasks()` in `popup.js`
calls `TasksApi.fetchRecentTasks()`, which requests the 5 most recently
created tasks (`order=created_at.desc&limit=5`, selecting only
`id,title,status,priority,created_at`) for the current user, renders each as
a row with its title and a status badge, and writes the result to
`chrome.storage.local` (`TasksApi._setCachedTasks()`) for next time.

## Configuration required

`chrome-extension/config.js` already ships pre-filled with this repo's local
dev Supabase project (read from `.env.local`), so the extension works
out of the box against `localhost:3000`'s backend:

```js
const CONFIG = {
  SUPABASE_URL: "https://rzkqzkcoyokgqoeukiub.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_...",
  DASHBOARD_URL: "http://localhost:3000",
};
```

If you point this at a **different** Supabase project, use the **same
values** as that project's `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. The anon/publishable key is safe to ship
here — it's the same public key already bundled into the web app's
client-side JS, and RLS still governs every request. If you ever revert
either value to the placeholder text, `utils.js` detects it and shows
"Invalid configuration…" immediately instead of a raw network error.

If your Supabase project is not on the default `*.supabase.co` domain
(self-hosted, custom domain), also update `host_permissions` in
`manifest.json` to match your project's origin, or requests will be blocked
by the browser.

## Manual steps (not performed by this change)

1. Open `chrome://extensions`, enable **Developer mode**, click
   **Load unpacked**, and select the `chrome-extension/` folder.
2. Sign in inside the popup with an existing TaskFlow account (create one
   via the web app's Sign Up page first, if you don't have one).
3. If you retarget the extension at a different Supabase project, edit
   `chrome-extension/config.js` and reload the extension from
   `chrome://extensions`.
4. Optional: replace `icons/icon16.png`, `icon48.png`, `icon128.png` with
   custom artwork (same filenames and sizes) — the current icons are
   generated placeholders.

## Packages / environment variables

- **No npm packages were added** to the repository — the extension uses
  vanilla JS and the `fetch` API only, with no dependency on `supabase-js`
  or a bundler.
- **No environment variables were added or changed** in the Next.js app.
  The extension keeps its own copy of the two public Supabase values in
  `config.js` (see Configuration above), since a browser extension cannot
  read the app's `.env.local` at build time.
