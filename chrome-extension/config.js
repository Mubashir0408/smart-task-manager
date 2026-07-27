// ---------------------------------------------------------------------------
// TaskFlow Quick Add — configuration
//
// Fill these in with the SAME values used by the Next.js app's
// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.local).
// The anon key is safe to ship client-side — it is the same key already
// bundled into the web app's browser JS, and every request made with it is
// still constrained by the tasks table's Row Level Security policies.
//
// If your Supabase project URL is not on the *.supabase.co domain (e.g. a
// self-hosted instance or a custom domain), also update `host_permissions`
// in manifest.json to match, or requests will be blocked.
// ---------------------------------------------------------------------------

const CONFIG = {
  // Project Settings > API > Project URL
  SUPABASE_URL: "https://rzkqzkcoyokgqoeukiub.supabase.co",

  // Project Settings > API > Project API keys > anon public / publishable key
  SUPABASE_ANON_KEY: "sb_publishable_k5deOAWnx1EQeK59CV5ngw_gRFGIRhI",

  // Where "Open Dashboard" and post-login links point. Use the deployed URL
  // in production, or http://localhost:3000 while running `npm run dev`.
  DASHBOARD_URL: "https://smart-task-manager-jtgzjcfvt-mubashir-ejaz.vercel.app",
};
