import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function bangkokToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "กรุณาเข้าสู่ระบบก่อนใช้ AI" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("Missing Supabase server environment");
    return json({ error: "ระบบ AI ยังตั้งค่าไม่สมบูรณ์" }, 503);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, 401);

  const { data: profile, error: profileError } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError || !profile || !["admin", "partner"].includes(profile.role)) {
    return json({ error: "ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้ได้" }, 403);
  }

  let payload: { text?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, 400);
  }
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text || text.length > 200) return json({ error: "กรุณากรอกข้อความ 1–200 ตัวอักษร" }, 400);

  const serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: apiKey, error: secretError } = await serviceClient.rpc("admin_get_deepseek_api_key");
  if (secretError || typeof apiKey !== "string" || !apiKey) {
    return json({ error: "ผู้ดูแลระบบยังไม่ได้ตั้งค่า DeepSeek API Key" }, 503);
  }

  const { data: categories } = await userClient
    .from("categories")
    .select("name,type")
    .eq("user_id", userData.user.id)
    .limit(100);

  const categoryList = (categories ?? []).map((item) => `${item.name} (${item.type})`).join(", ");
  const today = bangkokToday();
  const prompt = `คุณเป็นผู้ช่วยแยกข้อความบันทึกรายรับรายจ่ายภาษาไทย ให้แปลงข้อความเป็น JSON เท่านั้น
วันที่ปัจจุบันในเขตเวลา Asia/Bangkok คือ ${today}
หมวดหมู่ที่ผู้ใช้มี: ${categoryList || "ไม่มีหมวดหมู่"}
ข้อความผู้ใช้: "${text}"

ส่ง JSON object ที่มี key:
- type: "income" หรือ "expense" หรือ null
- amount_thb: number หรือ null (จำนวนเงินบาท ไม่ใช่สตางค์)
- occurred_on: วันที่ YYYY-MM-DD ถ้าผู้ใช้ไม่ระบุให้ใช้วันที่ปัจจุบัน ${today}
- category_name: ชื่อหมวดหมู่ที่ตรงกับรายการจากรายการที่ให้ หรือ null
- note: คำอธิบายสั้น ๆ ภาษาไทย
- confidence: number 0 ถึง 1

ห้ามเดาข้อมูลจำนวนเงิน หากไม่มีจำนวนเงินให้เป็น null
คำว่าได้รับ/เงินเดือน/ขายได้ เป็น income; จ่าย/ซื้อ/กิน/เดินทาง เป็น expense
ตอบเฉพาะ JSON ไม่มี Markdown หรือข้อความอื่น`;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You extract structured Thai personal finance entries. Return valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      console.error("DeepSeek request failed", response.status);
      return json({ error: "AI ประมวลผลไม่สำเร็จ กรุณาลองใหม่ภายหลัง" }, 502);
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return json({ error: "AI ส่งผลลัพธ์ไม่ถูกต้อง" }, 502);
    const parsed = JSON.parse(content);
    const type = parsed.type === "income" || parsed.type === "expense" ? parsed.type : null;
    const amount = typeof parsed.amount_thb === "number" && Number.isFinite(parsed.amount_thb) && parsed.amount_thb > 0 && parsed.amount_thb <= 100000000
      ? Math.round(parsed.amount_thb * 100) / 100
      : null;
    const date = typeof parsed.occurred_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.occurred_on)
      ? parsed.occurred_on
      : today;
    const availableCategory = (categories ?? []).find((item) => item.name === parsed.category_name && item.type === type);
    const draft = {
      type,
      amount_thb: amount,
      occurred_on: date,
      category_name: availableCategory?.name ?? null,
      note: typeof parsed.note === "string" ? parsed.note.slice(0, 500) : text,
      confidence: typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
    };
    return json({ draft });
  } catch (error) {
    console.error("parse-entry failed", error instanceof Error ? error.name : "unknown");
    return json({ error: "ไม่สามารถเชื่อมต่อ AI ได้ กรุณาลองใหม่" }, 502);
  }
});
