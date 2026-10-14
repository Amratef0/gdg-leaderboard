import { createClient } from "@supabase/supabase-js";

// SERVICE ROLE client — only used inside src/app/api/**/route.js
// (never imported into a "use client" component). Only needed for
// the optional /api/award-points bridge below.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
