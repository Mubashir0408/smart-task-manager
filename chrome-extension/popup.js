// ---------------------------------------------------------------------------
// TaskFlow Quick Add — popup controller
//
// Wires up the two popup views (sign-in vs. task creation) using the Auth
// and TasksApi modules. No task/auth business logic lives here — this file
// only handles DOM state and delegates to auth.js / api.js.
//
// Startup is "stale-while-revalidate": if a session (and possibly a cached
// task list) is already in chrome.storage.local, the app view renders
// immediately from that — zero network wait — while the session is
// validated/refreshed and fresh tasks are fetched in the background. See
// init() / syncInBackground() below.
// ---------------------------------------------------------------------------

const RECENT_TASKS_LIMIT = 5;

const els = {
  banner: document.getElementById("banner"),
  initLoading: document.getElementById("initLoading"),

  loginSection: document.getElementById("loginSection"),
  loginForm: document.getElementById("loginForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  loginSubmit: document.getElementById("loginSubmit"),

  appSection: document.getElementById("appSection"),
  userEmail: document.getElementById("userEmail"),
  signOutBtn: document.getElementById("signOutBtn"),

  taskForm: document.getElementById("taskForm"),
  taskTitle: document.getElementById("taskTitle"),
  taskDescription: document.getElementById("taskDescription"),
  taskStatus: document.getElementById("taskStatus"),
  titleError: document.getElementById("titleError"),
  createTaskBtn: document.getElementById("createTaskBtn"),
  createTaskLabel: document.getElementById("createTaskLabel"),
  createTaskSpinner: document.getElementById("createTaskSpinner"),

  refreshBtn: document.getElementById("refreshBtn"),
  recentList: document.getElementById("recentList"),
  recentEmpty: document.getElementById("recentEmpty"),

  openDashboardBtn: document.getElementById("openDashboardBtn"),
};

// Holds the active session so we don't re-read chrome.storage on every click.
let currentSession = null;
let bannerTimeout = null;

// -- Banner -------------------------------------------------------------

function showBanner(type, message, autoHideMs = 0) {
  clearTimeout(bannerTimeout);
  els.banner.textContent = message;
  els.banner.className = `banner banner--${type}`;
  els.banner.hidden = false;
  if (autoHideMs > 0) {
    bannerTimeout = setTimeout(() => {
      els.banner.hidden = true;
    }, autoHideMs);
  }
}

function hideBanner() {
  clearTimeout(bannerTimeout);
  els.banner.hidden = true;
}

// -- View switching -------------------------------------------------------

function showLoginView() {
  els.initLoading.hidden = true;
  els.appSection.hidden = true;
  els.loginSection.hidden = false;
}

/**
 * Reveals the app view using data already in hand — a session object and
 * (optionally) a cached task list — with zero network wait. Callers decide
 * separately whether/when to kick off a fetch for fresh data (see
 * loadRecentTasks()); this function only ever touches the DOM.
 */
function showAppView(session, cachedTasks = null) {
  currentSession = session;
  els.initLoading.hidden = true;
  els.loginSection.hidden = true;
  els.appSection.hidden = false;
  els.userEmail.textContent = session.user?.email ?? "";

  if (cachedTasks) {
    renderRecentTasks(cachedTasks);
  } else {
    renderSkeleton();
  }
}

// -- Sign in ----------------------------------------------------------------

async function handleLoginSubmit(event) {
  event.preventDefault();
  hideBanner();

  const email = els.loginEmail.value.trim();
  const password = els.loginPassword.value;

  if (!email) {
    showBanner("error", "Email is required.");
    return;
  }
  if (!isValidEmail(email)) {
    showBanner("error", "Enter a valid email address.");
    return;
  }
  if (!password) {
    showBanner("error", "Password is required.");
    return;
  }

  els.loginSubmit.disabled = true;
  els.loginSubmit.textContent = "Signing in…";

  try {
    const session = await Auth.signIn(email, password);
    els.loginForm.reset();
    showAppView(session); // no task cache yet right after a fresh sign-in
    loadRecentTasks(session); // fire-and-forget: don't block re-enabling the button below
  } catch (err) {
    console.error("[TaskFlow] Login failed:", err.kind ?? "unknown", err.message);
    showBanner("error", err.message || "Unexpected error. Please try again.");
  } finally {
    els.loginSubmit.disabled = false;
    els.loginSubmit.textContent = "Sign In";
  }
}

async function handleSignOut() {
  await Auth.signOut();
  await TasksApi.clearCache();
  currentSession = null;
  els.recentList.innerHTML = "";
  hideBanner();
  showLoginView();
}

// -- Task creation ------------------------------------------------------

function setCreateTaskLoading(isLoading) {
  els.createTaskBtn.disabled = isLoading;
  els.createTaskLabel.hidden = isLoading;
  els.createTaskSpinner.hidden = !isLoading;
}

async function handleTaskFormSubmit(event) {
  event.preventDefault();
  hideBanner();
  els.titleError.textContent = "";

  const title = els.taskTitle.value.trim();
  if (!title) {
    els.titleError.textContent = "Title is required.";
    return;
  }
  if (title.length > 200) {
    els.titleError.textContent = "Title must be 200 characters or fewer.";
    return;
  }

  setCreateTaskLoading(true);
  try {
    const session = await ensureFreshSession();
    await TasksApi.createTask(session, {
      title,
      description: els.taskDescription.value,
      status: els.taskStatus.value,
    });

    els.taskForm.reset();
    showBanner("success", "Task created.", 3000);
    await loadRecentTasks(session);
  } catch (err) {
    console.error("[TaskFlow] Create task failed:", err.kind ?? "unknown", err.message);
    showBanner("error", err.message || "Could not create the task.");
    if (err.kind === "invalid_credentials") {
      await Auth.signOut();
      showLoginView();
    }
  } finally {
    setCreateTaskLoading(false);
  }
}

// -- Recent tasks -------------------------------------------------------

function statusLabel(status) {
  return { todo: "Todo", in_progress: "In Progress", completed: "Completed" }[status] ?? status;
}

/** Lightweight shimmering placeholder rows — shown only when there is no
 *  cached list to display yet (first-ever load for this account). */
function renderSkeleton(count = 3) {
  els.recentList.innerHTML = "";
  els.recentEmpty.hidden = true;

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const li = document.createElement("li");
    li.className = "recent__item recent__item--skeleton";

    const title = document.createElement("span");
    title.className = "skeleton-bar skeleton-bar--title";
    const badge = document.createElement("span");
    badge.className = "skeleton-bar skeleton-bar--badge";

    li.append(title, badge);
    fragment.appendChild(li);
  }
  els.recentList.appendChild(fragment);
}

function renderRecentTasks(tasks) {
  els.recentList.innerHTML = "";
  els.recentEmpty.hidden = tasks.length > 0;

  for (const task of tasks) {
    const li = document.createElement("li");
    li.className = "recent__item";

    const title = document.createElement("span");
    title.className = "recent__item-title";
    title.textContent = task.title;
    title.title = task.title;

    const badge = document.createElement("span");
    badge.className = `badge badge--${task.status}`;
    badge.textContent = statusLabel(task.status);

    li.append(title, badge);
    els.recentList.appendChild(li);
  }
}

/**
 * Loads the 5 most recent tasks and renders them, caching the result for
 * next time. Pass an already-validated `session` when one is in hand (avoids
 * a redundant Auth.getValidSession() call); omit it to have this validate
 * one itself (used by the refresh button and after creating a task).
 */
async function loadRecentTasks(session) {
  const t0 = performance.now();
  // Skeleton placeholders don't count as "real" content — only an actual
  // rendered task row, or a confirmed "no tasks yet" empty state, should
  // suppress both the skeleton and the error banner below.
  const hasRealContent =
    !!els.recentList.querySelector(".recent__item:not(.recent__item--skeleton)") ||
    !els.recentEmpty.hidden;
  if (!hasRealContent) renderSkeleton();

  try {
    const activeSession = session ?? (await ensureFreshSession());
    const tasks = await TasksApi.fetchRecentTasks(activeSession, RECENT_TASKS_LIMIT);

    const tRender = performance.now();
    renderRecentTasks(tasks);
    perfLog("rendering (recent tasks list)", tRender);
  } catch (err) {
    console.error("[TaskFlow] Load recent tasks failed:", err.kind ?? "unknown", err.message);
    // A background refresh failing shouldn't yank away perfectly good
    // cached data the user can already see — only surface a banner when
    // there was nothing real on screen to begin with.
    if (!hasRealContent) {
      showBanner("error", err.message || "Could not load recent tasks.");
    } else {
      console.warn("[TaskFlow] Keeping cached tasks on screen after a failed refresh.");
    }
    if (err.kind === "invalid_credentials") {
      await Auth.signOut();
      showLoginView();
    }
  } finally {
    perfLog("loadRecentTasks total", t0);
  }
}

// -- Dashboard link -------------------------------------------------------

function handleOpenDashboard() {
  chrome.tabs.create({ url: `${CONFIG.DASHBOARD_URL}/dashboard` });
}

// -- Session helper ---------------------------------------------------------

/** Refreshes the token if needed and signs the user out if it can't be renewed. */
async function ensureFreshSession() {
  const session = await Auth.getValidSession();
  if (!session) {
    showLoginView();
    throw taggedError("invalid_credentials", "Your session expired. Please sign in again.");
  }
  currentSession = session;
  return session;
}

// -- Init -------------------------------------------------------------------

/**
 * Validates/refreshes the session and fetches fresh tasks. Runs after the
 * popup is already interactive (see init()) — never blocks the UI. Falls
 * back to the login view on its own if the cached session turns out to be
 * dead (expired refresh token, revoked session, etc).
 */
async function syncInBackground() {
  const session = await Auth.getValidSession();
  if (!session) {
    showLoginView();
    return;
  }
  currentSession = session;
  els.userEmail.textContent = session.user?.email ?? "";
  await loadRecentTasks(session);
}

async function init() {
  const tInit = performance.now();
  els.loginForm.addEventListener("submit", handleLoginSubmit);
  els.taskForm.addEventListener("submit", handleTaskFormSubmit);
  els.signOutBtn.addEventListener("click", handleSignOut);
  els.refreshBtn.addEventListener("click", () => loadRecentTasks());
  els.openDashboardBtn.addEventListener("click", handleOpenDashboard);

  try {
    // chrome.storage.local only — no network — resolves in a few ms, so the
    // popup never blocks on Supabase before showing something useful.
    const cached = await Auth.getSession();
    if (!cached) {
      showLoginView();
      return;
    }

    const cachedTasks = await TasksApi.getCachedTasks(cached.user?.id);
    showAppView(cached, cachedTasks);
    perfLog("extension startup (popup interactive)", tInit);

    // Validate/refresh the session and fetch fresh tasks in the background —
    // the UI is already interactive at this point.
    syncInBackground();
  } catch (err) {
    console.error("[TaskFlow] Startup failed:", err.kind ?? "unknown", err.message);
    showLoginView();
  } finally {
    els.initLoading.hidden = true;
  }
}

init();
