// ---------------------------------------------------------------------------
// TaskFlow Quick Add — API module
//
// Reads and writes the same `public.tasks` table as the Next.js app, via
// Supabase's auto-generated PostgREST API (SUPABASE_URL + "/rest/v1/tasks").
// No parallel backend or business logic is introduced: every request
// carries the signed-in user's access token, so the table's existing Row
// Level Security policies (see supabase/schema.sql) decide what is visible
// or writable — identical to how src/services/tasks.ts behaves in-app.
// ---------------------------------------------------------------------------

// Last-fetched recent-tasks list, cached so the popup can render instantly
// on the next open instead of showing a blank/loading state while the
// network round-trip (typically several hundred ms to 1-2s for a cold
// popup context) completes in the background.
const TASKS_CACHE_KEY = "taskflow_recent_tasks_cache";

const TasksApi = {
  _headers(session) {
    return {
      apikey: CONFIG.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };
  },

  /**
   * Returns the last-fetched task list for this user, or null if nothing is
   * cached yet (first-ever load) or the cache belongs to a different user.
   * chrome.storage.local only — no network, resolves in a few ms.
   */
  async getCachedTasks(userId) {
    if (!userId) return null;
    const t0 = performance.now();
    const { [TASKS_CACHE_KEY]: cache } = await chrome.storage.local.get(TASKS_CACHE_KEY);
    perfLog("tasks cache read (chrome.storage.local, no network)", t0);
    return cache && cache.userId === userId ? cache.tasks : null;
  },

  async _setCachedTasks(userId, tasks) {
    await chrome.storage.local.set({
      [TASKS_CACHE_KEY]: { userId, tasks, cachedAt: Date.now() },
    });
  },

  /** Clears the cached task list — called on sign-out so a later sign-in
   *  (same or different account) never briefly shows a stale list. */
  async clearCache() {
    await chrome.storage.local.remove(TASKS_CACHE_KEY);
  },

  /** Fetches the user's most recent tasks, newest first. */
  async fetchRecentTasks(session, limit = 5) {
    // Only the columns the popup actually renders (title + status), plus id
    // for the DOM key and created_at for ordering — never `select=*`.
    const params = new URLSearchParams({
      select: "id,title,status,priority,created_at",
      order: "created_at.desc",
      limit: String(limit),
    });

    const t0 = performance.now();
    const res = await safeFetch(`${CONFIG.SUPABASE_URL}/rest/v1/tasks?${params}`, {
      headers: this._headers(session),
    });
    perfLog("Supabase request: fetch recent tasks", t0);

    if (!res.ok) {
      console.error("[TaskFlow] Fetch recent tasks failed:", res.status);
      if (res.status === 401) {
        throw taggedError("invalid_credentials", "Your session has expired. Please sign in again.");
      }
      throw taggedError("server", "Could not load recent tasks. Please try again.");
    }

    const tasks = await res.json();
    await this._setCachedTasks(session.user.id, tasks);
    return tasks;
  },

  /**
   * Creates a task owned by the signed-in user. Mirrors the defaults and
   * trimming behavior of createTask() in src/services/tasks.ts.
   */
  async createTask(session, { title, description, status, priority }) {
    const payload = {
      user_id: session.user.id,
      title: title.trim(),
      description: description?.trim() || null,
      status: status || "todo",
      priority: priority || "medium",
    };

    const res = await safeFetch(`${CONFIG.SUPABASE_URL}/rest/v1/tasks`, {
      method: "POST",
      headers: {
        ...this._headers(session),
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("[TaskFlow] Create task failed:", res.status, data?.message);
      if (res.status === 401) {
        throw taggedError("invalid_credentials", "Your session has expired. Please sign in again.");
      }
      throw taggedError("server", data?.message || "Could not create the task. Please try again.");
    }

    const [task] = await res.json();
    return task;
  },
};
