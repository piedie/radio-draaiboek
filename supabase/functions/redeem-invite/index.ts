// supabase/functions/redeem-invite/index.ts
// Redeems an invite token: ensures the current user becomes a member of the program with the invite's role.

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

    // Verify caller identity (using token)
    const authed = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userRes, error: userErr } = await authed.auth.getUser();
    if (userErr || !userRes?.user) return json({ error: "Unauthorized" }, { status: 401 });
    const userId = userRes.user.id;

    const body = await req.json().catch(() => ({}));
    const invite_token = body?.invite_token as string | undefined;
    if (!invite_token) return json({ error: "invite_token is required" }, { status: 400 });

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Load invite
    const { data: invite, error: invErr } = await supabaseAdmin
      .from("program_invites")
      .select("id, program_id, role, expires_at, revoked_at")
      .eq("invite_token", invite_token)
      .maybeSingle();

    if (invErr) return json({ error: invErr.message }, { status: 500 });
    if (!invite) return json({ error: "Invalid invite token" }, { status: 404 });

    if (invite.revoked_at) return json({ error: "Invite revoked" }, { status: 410 });
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      return json({ error: "Invite expired" }, { status: 410 });
    }

    // Upsert membership
    const { error: upErr } = await supabaseAdmin
      .from("program_memberships")
      .upsert(
        {
          program_id: invite.program_id,
          user_id: userId,
          role: invite.role ?? "viewer",
        },
        { onConflict: "program_id,user_id" },
      );

    if (upErr) return json({ error: upErr.message }, { status: 500 });

    return json({ ok: true, program_id: invite.program_id, role: invite.role });
  } catch (e) {
    return json({ error: (e as Error)?.message ?? "Unknown error" }, { status: 500 });
  }
});
