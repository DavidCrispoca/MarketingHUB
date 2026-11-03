import { createClient } from "@supabase/supabase-js";
import { createLocalClient } from "./local-backend.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const requestedMode = import.meta.env.VITE_DATA_MODE?.trim().toLowerCase();

// Local review is the default; Supabase stays opt-in until the local flows are signed off.
export const isLocalMode = requestedMode !== "supabase";
export const isSupabaseConfigured = Boolean(url && key);

export const supabase = isLocalMode
  ? createLocalClient()
  : isSupabaseConfigured
    ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
    : null;
