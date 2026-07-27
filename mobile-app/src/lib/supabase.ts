// ---------------------------------------------------------------------------
// TaskFlow Mobile — Supabase client
//
// Same backend as the web app and Chrome extension: the exact same Auth
// user pool and `tasks` table, protected by the exact same RLS policies
// (see supabase/schema.sql in the Next.js project). No business logic is
// duplicated here — this is a thin, official-pattern client setup.
//
// React Native has no `localStorage`, so sessions are persisted via
// AsyncStorage instead (the standard Supabase-recommended approach for
// React Native). `detectSessionInUrl: false` because there is no browser
// URL to parse on a native app.
// ---------------------------------------------------------------------------
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
