import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://money-tracking.kajonsak6210035.workers.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function response(body: unknown, status: number, origin: string | null) {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "Vary": "Origin" });
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

  const token = req.headers.get("Authorization")?.replace(/^Bearer\\s+/i, "");
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
  const { data: profile, error: profileError } = await userClient.from("profiles").select("role")
    .eq("id", authData.user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return response({ error: "Admin access required" }, 403, origin);

  let body: { action?: unknown; apiKey?: unknown; settings?: unknown };
  try { body = await req.json(); } catch { return response({ error: "Invalid JSON" }, 400, origin); }
  const serviceClient = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  if (body.action === "status") {
    const { data, error } = await serviceClient.rpc("admin_deepseek_key_status");
    if (error) return response({ error: "Could not read key status" }, 500, origin);
    return response({ configured: Boolean(data) }, 200, origin);
  }

  if (body.action === "set") {
    if (typeof body.apiKey !== "string" || body.apiKey.trim().length < 20 || body.apiKey.length > 500)
      return response({ error: "Invalid API key format" }, 400, origin);
    const { error } = await serviceClient.rpc("admin_set_deepseek_api_key", {
      p_api_key: body.apiKey.trim(), p_actor_id: authData.user.id,
    });
    if (error) {
      console.error("Vault update failed", error.code ?? "unknown");
      return response({ error: "Could not save API key securely" }, 500, origin);
    }
    return response({ ok: true }, 200, origin);
  }

  if (body.action === "remove") {
    const { error } = await serviceClient.rpc("admin_remove_deepseek_api_key", { p_actor_id: authData.user.id });
    if (error) return response({ error: "Could not remove API key" }, 500, origin);
    return response({ ok: true }, 200, origin);
  }

  if (body.action === "balance" || body.action === "test") {
    const { data: apiKey, error: secretError } = await serviceClient.rpc("admin_get_deepseek_api_key");
    if (secretError || typeof apiKey !== "string" || !apiKey)
      return response({ error: "ยังไม่ได้ตั้งค่า DeepSeek API Key" }, 503, origin);
    const upstream = await fetch("https://api.deepseek.com/user/balance", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    }).catch(() => null);
    if (!upstream) return response({ error: "เชื่อมต่อ DeepSeek ไม่สำเร็จ กรุณาลองใหม่" }, 502, origin);
    if (!upstream.ok) {
      console.error("DeepSeek balance check failed", upstream.status);
      return response({ error: upstream.status === 401 || upstream.status === 403
        ? "DeepSeek API Key ไม่ถูกต้องหรือไม่มีสิทธิ์อ่านยอดคงเหลือ"
        : upstream.status === 402 ? "ยอดคงเหลือ DeepSeek ไม่เพียงพอ"
        : `DeepSeek ตอบกลับด้วยสถานะ ${upstream.status}` }, 502, origin);
    }
    const result = await upstream.json();
    const balances = Array.isArray(result?.balance_infos) ? result.balance_infos.map((item: Record<string, unknown>) => ({
      currency: typeof item.currency === "string" ? item.currency : "—",
      total_balance: typeof item.total_balance === "string" ? item.total_balance : "0",
      granted_balance: typeof item.granted_balance === "string" ? item.granted_balance : "0",
      topped_up_balance: typeof item.topped_up_balance === "string" ? item.topped_up_balance : "0",
    })) : [];
    return response({ connected: true, is_available: Boolean(result?.is_available), balances, checked_at: new Date().toISOString() }, 200, origin);
  }

  if (body.action === "get-settings") {
    const { data, error } = await serviceClient.from("app_settings").select("key,value");
    if (error) return response({ error: "Could not load app settings" }, 500, origin);
    const settings = Object.fromEntries((data ?? []).map((row: { key: string; value: unknown }) => [row.key, row.value]));
    return response({ settings }, 200, origin);
  }

  if (body.action === "update-settings") {
    const value = body.settings as Record<string, unknown> | null;
    if (!value || typeof value !== "object" ||
      typeof value.app_name !== "string" || value.app_name.trim().length < 2 || value.app_name.trim().length > 40 ||
      typeof value.app_tagline !== "string" || value.app_tagline.trim().length > 100 ||
      typeof value.deepseek_low_balance_threshold !== "number" ||
      !Number.isFinite(value.deepseek_low_balance_threshold) || value.deepseek_low_balance_threshold < 0 ||
      value.deepseek_low_balance_threshold > 1000000) {
      return response({ error: "ข้อมูลการตั้งค่าไม่ถูกต้อง" }, 400, origin);
    }
    const rows = [
      { key: "app_name", value: value.app_name.trim(), updated_at: new Date().toISOString(), updated_by: authData.user.id },
      { key: "app_tagline", value: value.app_tagline.trim(), updated_at: new Date().toISOString(), updated_by: authData.user.id },
      { key: "deepseek_low_balance_threshold", value: value.deepseek_low_balance_threshold, updated_at: new Date().toISOString(), updated_by: authData.user.id },
    ];
    const { error } = await serviceClient.from("app_settings").upsert(rows, { onConflict: "key" });
    if (error) return response({ error: "บันทึกการตั้งค่าระบบไม่สำเร็จ" }, 500, origin);
    await serviceClient.from("admin_audit_logs").insert({
      actor_id: authData.user.id, action: "settings.app.updated",
      details: { app_name: value.app_name.trim(), app_tagline: value.app_tagline.trim() },
    });
    return response({ ok: true }, 200, origin);
  }

  return response({ error: "Unsupported action" }, 400, origin);
});
