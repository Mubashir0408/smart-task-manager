// ---------------------------------------------------------------------------
// TaskFlow Quick Add — shared helpers
//
// Input validation and network-error classification shared by auth.js,
// api.js, and popup.js. Centralized here so every request fails the same
// way and popup.js never has to guess what a raw fetch() error means.
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_RE.test(email);
}

/** True if config.js still has its placeholder values (never configured). */
function isPlaceholderConfig() {
  return (
    !CONFIG.SUPABASE_URL ||
    !CONFIG.SUPABASE_ANON_KEY ||
    CONFIG.SUPABASE_URL.includes("YOUR-PROJECT-REF") ||
    CONFIG.SUPABASE_ANON_KEY.includes("YOUR-SUPABASE-ANON-KEY")
  );
}

/** Builds an Error with a `.kind` tag so callers can branch on failure type. */
function taggedError(kind, message) {
  const err = new Error(message);
  err.kind = kind;
  return err;
}

/**
 * Logs the elapsed time since `startTime` (a `performance.now()` reading)
 * under a consistent, greppable prefix — used across auth.js/api.js/popup.js
 * to make each phase of popup startup (session retrieval, auth check,
 * Supabase request, render) individually measurable in the popup's own
 * DevTools console (right-click the extension icon → Inspect popup).
 */
function perfLog(label, startTime) {
  console.info(`[TaskFlow][perf] ${label}: ${(performance.now() - startTime).toFixed(0)}ms`);
}

// Supabase GoTrue (Auth) error_code -> user-friendly message. Keyed on the
// `error_code` field in the JSON error body (e.g.
// {"code":400,"error_code":"email_not_confirmed","msg":"Email not confirmed"}),
// NOT on the HTTP status alone — Supabase uses 400 for many distinct auth
// failures, so branching on status code alone (as an earlier version of this
// file did) collapses them all into one misleading message.
const AUTH_ERROR_MESSAGES = {
  invalid_credentials: "Invalid email or password.",
  email_not_confirmed:
    "Email not confirmed. Check your inbox (and spam folder) for the confirmation link before signing in.",
  user_not_found: "No account found with that email.",
  user_banned: "This account has been disabled.",
  over_request_rate_limit: "Too many attempts. Please wait a moment and try again.",
  over_email_send_rate_limit: "Too many attempts. Please wait a moment and try again.",
  weak_password: "Password does not meet the project's strength requirements.",
};

/**
 * Turns a non-OK Supabase Auth response into a user-friendly, typed error.
 * Logs the parsed error body (status + error_code + msg — never a password
 * or token, since Supabase error responses never include either) so the
 * exact cause is visible in the extension's console.
 */
function describeAuthError(status, data) {
  console.error("[TaskFlow] Supabase auth error:", {
    status,
    error_code: data?.error_code,
    error: data?.error,
    msg: data?.msg || data?.error_description,
  });

  const code = data?.error_code || data?.error;
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return taggedError(code, AUTH_ERROR_MESSAGES[code]);
  }
  if (status === 400 || status === 401 || status === 422) {
    // Unrecognized 4xx from Supabase: surface its own message rather than
    // silently relabeling it as "Invalid email or password."
    return taggedError("invalid_credentials", data?.msg || data?.error_description || "Invalid email or password.");
  }
  return taggedError("server", data?.msg || data?.error_description || "Unexpected server error. Please try again.");
}

/**
 * fetch() wrapper that turns the three ways a request can fail before ever
 * reaching Supabase into clear, typed errors instead of a bare "Failed to
 * fetch": bad/unfilled config, no network connectivity, and DNS/CORS/
 * host-permission failures reaching the Supabase host itself. Successful
 * fetches (including HTTP 4xx/5xx responses) are returned as-is so callers
 * can inspect status codes/response bodies.
 */
async function safeFetch(url, options) {
  if (isPlaceholderConfig()) {
    throw taggedError(
      "config",
      "Invalid configuration: chrome-extension/config.js still has placeholder Supabase values. Update SUPABASE_URL and SUPABASE_ANON_KEY, then reload the extension."
    );
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw taggedError("offline", "No internet connection. Check your network and try again.");
  }

  try {
    return await fetch(url, options);
  } catch (networkErr) {
    // Browsers collapse DNS failures, CORS rejections, and refused
    // connections into the same generic TypeError("Failed to fetch") — log
    // the real cause for debugging, but surface a specific message to the UI.
    console.error("[TaskFlow] Network request failed:", url, networkErr);
    throw taggedError(
      "network",
      "Cannot reach Supabase. Check your internet connection and the Supabase URL in config.js."
    );
  }
}
