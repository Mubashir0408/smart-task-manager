// ---------------------------------------------------------------------------
// TaskFlow Mobile — Supabase configuration
//
// Same project as the web app (see the Next.js project's .env.local) and
// the Chrome extension (chrome-extension/config.js) — one Supabase backend,
// three clients. The anon/publishable key is safe to ship in the app
// bundle: it's the same public key already embedded in the web app's
// browser JS, and every request is still constrained by the `tasks`
// table's Row Level Security policies (see supabase/schema.sql in the
// Next.js project).
//
// React Native has no built-in .env support, so — matching how the Chrome
// extension does this (config.js, not a hidden .env) — these are plain,
// checked-in constants rather than hardcoded secrets. There's nothing
// secret here to protect.
// ---------------------------------------------------------------------------

export const SUPABASE_URL = "https://rzkqzkcoyokgqoeukiub.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_k5deOAWnx1EQeK59CV5ngw_gRFGIRhI";
