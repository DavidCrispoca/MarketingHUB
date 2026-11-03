// Redeems an access code for the calling (anonymous) session.
// The code itself never reaches the database in clear text: only its hash.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 40;
const MIN_CODE_LENGTH = 6;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Must match public.create_access_code: uppercase + trim, then SHA-256 hex.
async function hashCode(rawCode: string) {
  const normalized = rawCode.trim().toUpperCase();
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let payload: { name?: string; code?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_payload" }, 400);
  }

  const name = String(payload.name ?? "")
    .trim()
    .replace(/ +/g, " ");
  const code = String(payload.code ?? "").trim();

  if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
    return json({ error: "invalid_name" }, 400);
  }
  if (code.length < MIN_CODE_LENGTH) {
    return json({ error: "invalid_code" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization");
  if (!supabaseUrl || !serviceRoleKey || !authHeader) {
    return json({ error: "not_configured" }, 500);
  }

  // Service role: access_codes has no RLS policies, so only the server reads it.
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (userError || !userData.user) return json({ error: "no_session" }, 401);

  const { data: codeRow, error: codeError } = await admin
    .from("access_codes")
    .select("id, active")
    .eq("code_hash", await hashCode(code))
    .maybeSingle();

  if (codeError) return json({ error: "server_error" }, 500);
  if (!codeRow || !codeRow.active) return json({ error: "invalid_code" }, 403);

  const { error: grantError } = await admin.from("access_grants").upsert(
    {
      user_id: userData.user.id,
      access_code_id: codeRow.id,
      holder_name: name,
    },
    { onConflict: "user_id" },
  );
  if (grantError) return json({ error: "server_error" }, 500);

  await admin
    .from("access_codes")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", codeRow.id);

  return json({ ok: true, holder_name: name });
});
