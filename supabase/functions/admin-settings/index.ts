import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://money-tracking.kajonsak6210035.workers.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function response(body: unknown, status: number, origin: string | null) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  });
  if (origin && allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return response({ ok: true }, 200, origin);
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return response({ error: "Origin not allowed" }, 403, origin);

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return response({ error: "Authentication required" }, 401, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return response({ error: "Server configuration incomplete" }, 503, origin);

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return response({ error: "Invalid session" }, 401, origin);

  const { data: profile, error: profileError } = await userClient
    .from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return response({ error: "Admin access required" }, 403, origin);

  let body: { action?: unknown; apiKey?: unknown };
  try { body = await req.json(); } catch { return response({ error: "Invalid JSON" }, 400, origin); }
  const serviceClient = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (body.action === "status") {
    const { data, error } = await serviceClient.rpc("admin_deepseek_key_status");
    if (error) return response({ error: "Could not read key status" }, 500, origin);
    return response({ configured: Boolean(data) }, 200, origin);
  }

  if (body.action === "set") {
    if (typeof body.apiKey !== "string" || body.apiKey.trim().length < 20 || body.apiKey.length > 500) {
      return response({ error: "Invalid API key format" }, 400, origin);
    }
    const { error } = await serviceClient.rpc("admin_set_deepseek_api_key", {
      p_api_key: body.apiKey.trim(),
      p_actor_id: authData.user.id,
    });
    if (error) {
      console.error("Vault update failed", error.code ?? "unknown");
      return response({ error: "Could not save API key securely" }, 500, origin);
    }
    return response({ ok: true }, 200, origin);
  }

  if (body.action === "remove") {
    const { error } = await serviceClient.rpc("admin_remove_deepseek_api_key", {
      p_actor_id: authData.user.id,
    });
    if (error) return response({ error: "Could not remove API key" }, 500, origin);
    return response({ ok: true }, 200, origin);
  }

  return response({ error: "Unsupported action" }, 400, origin);
});
