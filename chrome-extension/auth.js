// ---------------------------------------------------------------------------
// TaskFlow Quick Add — auth module
//
// Talks directly to Supabase's Auth REST API (the same endpoint the web
// app's supabase-js client calls under the hood for
// `supabase.auth.signInWithPassword`). No custom auth logic is introduced —
// this is a thin passthrough, and every subsequent request still goes
// through the tasks table's existing Row Level Security policies.
//
// The session (access token, refresh token, expiry, user) is persisted in
// chrome.storage.local so the popup doesn't require signing in every time.
// ---------------------------------------------------------------------------

const SESSION_KEY = "taskflow_session";

// Headers the official supabase-js client sends on every Auth API request
// (see node_modules/@supabase/supabase-js SupabaseClient.ts's `authHeaders`):
// both `apikey` AND `Authorization: Bearer <anon key>`. The project's own
// anon/publishable key is used as the bearer token when there is no user
// session yet — supabase-js does this for sign-in and refresh calls alike.
// An earlier version of this file sent `apikey` only; this keeps every
// request byte-for-byte consistent with the official client.
const AUTH_HEADERS = {
  "Content-Type": "application/json",
  apikey: CONFIG.SUPABASE_ANON_KEY,
  Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
};

const Auth = {
  /** Reads the stored session, or null if the user has never signed in. */
  async getSession() {
    const t0 = performance.now();
    const { [SESSION_KEY]: session } = await chrome.storage.local.get(SESSION_KEY);
    perfLog("session retrieval (chrome.storage.local, no network)", t0);
    return session ?? null;
  },

  async _saveSession(session) {
    await chrome.storage.local.set({ [SESSION_KEY]: session });
    return session;
  },

  async _clearSession() {
    await chrome.storage.local.remove(SESSION_KEY);
  },

  /**
   * Signs in with email + password via Supabase Auth and persists the
   * resulting session. Mirrors src/components/auth/LoginForm.tsx.
   */
  async signIn(email, password) {
    const url = `${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=password`;
    console.info("[TaskFlow] Sign-in request:", { url, method: "POST", email });

    const t0 = performance.now();
    const res = await safeFetch(url, {
      method: "POST",
      headers: AUTH_HEADERS,
      body: JSON.stringify({ email, password }),
    });
    perfLog("Supabase request: sign in", t0);

    const data = await res.json().catch(() => ({}));
    console.info("[TaskFlow] Sign-in response:", { status: res.status, ok: res.ok });

    if (!res.ok) {
      // describeAuthError() logs the full (password/token-free) error body
      // and maps Supabase's specific error_code to a user-friendly message —
      // it does NOT collapse every 400/401 into "Invalid email or password.".
      throw describeAuthError(res.status, data);
    }

    console.info("[TaskFlow] Sign-in succeeded for user:", data.user?.id);
    return this._saveSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at, // unix seconds
      user: data.user,
    });
  },

  /** Best-effort server-side session revocation, then clears local storage. */
  async signOut() {
    const session = await this.getSession();
    if (session?.access_token) {
      try {
        await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/logout`, {
          method: "POST",
          headers: {
            apikey: CONFIG.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      } catch (err) {
        // Ignore network errors on logout — clearing local state still
        // signs the user out of the extension.
        console.warn("[TaskFlow] Server-side logout failed (ignored):", err.message);
      }
    }
    await this._clearSession();
  },

  async _refresh(refreshToken) {
    const t0 = performance.now();
    const res = await safeFetch(
      `${CONFIG.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: AUTH_HEADERS,
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );
    perfLog("Supabase request: refresh token", t0);

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[TaskFlow] Session refresh rejected:", res.status, data?.error_code || data?.error);
      throw taggedError("invalid_credentials", "Session expired. Please sign in again.");
    }

    return this._saveSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      user: data.user,
    });
  },

  /**
   * Returns a currently-valid session, refreshing it first if it is
   * expired (or about to expire). Returns null if the user is signed out
   * or the refresh token itself is no longer valid.
   */
  async getValidSession() {
    const t0 = performance.now();
    const session = await this.getSession();
    if (!session) {
      perfLog("authentication check (no stored session)", t0);
      return null;
    }

    const expiresInMs = session.expires_at * 1000 - Date.now();
    if (expiresInMs > 60_000) {
      // Cached token is still fresh — no refresh call needed, no network hit.
      perfLog("authentication check (cached token still valid)", t0);
      return session;
    }

    try {
      const refreshed = await this._refresh(session.refresh_token);
      perfLog("authentication check (refreshed)", t0);
      return refreshed;
    } catch (err) {
      console.warn("[TaskFlow] Could not refresh session, signing out:", err.message);
      await this._clearSession();
      return null;
    }
  },
};
