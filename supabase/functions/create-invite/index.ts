// supabase/functions/create-invite/index.ts
// Creates a program invite token (shareable link) for a given program + role.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

function getBearer(req: Request) {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

function randomToken(len = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  // url-safe base64
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return b64;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }

    const token = getBearer(req);
    if (!token) return json({ error: "Missing Authorization bearer token" }, { status: 401 });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Verify caller identity
    const authed = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userRes, error: userErr } = await authed.auth.getUser();
    if (userErr || !userRes?.user) return json({ error: "Unauthorized" }, { status: 401 });
    const userId = userRes.user.id;

    const body = await req.json().catch(() => ({}));
    const program_id = body?.program_id as string | undefined;
    const role = (body?.role as string | undefined) ?? "viewer";
    const expires_in_days = Number(body?.expires_in_days ?? 14);

    if (!program_id) return json({ error: "program_id is required" }, { status: 400 });

    // Enforce that caller is admin for this program
    const { data: membership, error: memErr } = await supabaseAdmin
      .from("program_memberships")
      .select("role")
      .eq("program_id", program_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (memErr) return json({ error: memErr.message }, { status: 500 });
    if (!membership || membership.role !== "admin") {
      return json({ error: "Forbidden: only program admins can create invites" }, { status: 403 });
    }

    const invite_token = randomToken(24);
    const expires_at = new Date(Date.now() + expires_in_days * 86400_000).toISOString();

    const { data: invite, error: invErr } = await supabaseAdmin
      .from("program_invites")
      .insert({
        program_id,
        role,
        invite_token,
        created_by: userId,
        expires_at,
      })
      .select("id, program_id, role, invite_token, expires_at, created_at")
      .single();

    if (invErr) return json({ error: invErr.message }, { status: 500 });

    return json({ invite });
  } catch (e) {
    return json({ error: (e as Error)?.message ?? "Unknown error" }, { status: 500 });
  }
});
