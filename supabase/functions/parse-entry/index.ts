import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!authorization || !supabaseUrl || !anonKey || !deepseekKey) {
    return json({ error: "บริการ AI ยังตั้งค่าไม่ครบ" }, 503);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "กรุณาเข้าสู่ระบบใหม่" }, 401);

  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, 400);
  }
  if (typeof body.text !== "string" || body.text.trim().length < 2 || body.text.length > 200) {
    return json({ error: "กรุณาพิมพ์รายการ 2–200 ตัวอักษร" }, 400);
  }

  const { data: categories, error: categoryError } = await supabase
    .from("categories").select("name,type").eq("user_id", user.id).order("name");
  if (categoryError) return json({ error: "ไม่สามารถโหลดหมวดหมู่ได้" }, 500);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  const prompt = [
    "แปลงข้อความภาษาไทยเป็นข้อมูลรายการการเงิน JSON เท่านั้น",
    "ห้ามคาดเดาจำนวนเงิน หากไม่พบให้ amount_thb เป็น null",
    "type ต้องเป็น income หรือ expense หรือ null",
    "occurred_on เป็นวันที่ YYYY-MM-DD โดยตีความ วันนี้/เมื่อวาน ตามวันที่ไทย",
    "category_name ต้องเลือกจากหมวดหมู่ที่ให้เท่านั้น หรือ null",
    "note เป็นคำอธิบายสั้น ๆ ที่ไม่รวมจำนวนเงินและวันที่",
    "คืน object keys: type, amount_thb, occurred_on, category_name, note, confidence",
    `วันที่วันนี้ในเขตเวลาไทย: ${today}`,
    `หมวดหมู่ที่อนุญาต: ${JSON.stringify(categories ?? [])}`,
    `ข้อความ: ${body.text.trim()}`,
  ].join("\n");

  const upstream = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${deepseekKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You extract financial transaction fields. Output valid JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!upstream.ok) return json({ error: "AI ไม่สามารถประมวลผลได้ในขณะนี้" }, 502);

  let payload: { choices?: Array<{ message?: { content?: string } }> };
  try {
    payload = await upstream.json();
  } catch {
    return json({ error: "AI ส่งข้อมูลกลับมาไม่ถูกต้อง" }, 502);
  }
  try {
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? "{}");
    const type = parsed.type === "income" || parsed.type === "expense" ? parsed.type : null;
    const amount = typeof parsed.amount_thb === "number" && Number.isFinite(parsed.amount_thb) && parsed.amount_thb > 0 && parsed.amount_thb <= 100000000
      ? Math.round(parsed.amount_thb * 100) / 100 : null;
    const date = typeof parsed.occurred_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.occurred_on) ? parsed.occurred_on : today;
    const allowed = (categories ?? []).some((item) => item.name === parsed.category_name && item.type === type);
    return json({
      draft: {
        type,
        amount_thb: amount,
        occurred_on: date,
        category_name: allowed ? parsed.category_name : null,
        note: typeof parsed.note === "string" ? parsed.note.slice(0, 500) : body.text.trim(),
        confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
      },
    });
  } catch {
    return json({ error: "ไม่สามารถอ่านผลลัพธ์จาก AI ได้ กรุณาลองใหม่" }, 502);
  }
});
