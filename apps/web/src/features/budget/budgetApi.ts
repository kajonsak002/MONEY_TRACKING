import { supabase } from "../../lib/supabase";
export interface MonthlyBudget { id: string; user_id: string; month_start: string; limit_satang: number; }
function client() { if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase"); return supabase; }
async function userId() {
  const { data: { user }, error } = await client().auth.getUser();
  if (error || !user) throw new Error("กรุณาเข้าสู่ระบบใหม่");
  return user.id;
}
export async function getMonthlyBudget(monthStart: string): Promise<MonthlyBudget | null> {
  const id = await userId();
  const { data, error } = await client().from("monthly_budgets").select("id,user_id,month_start,limit_satang").eq("user_id", id).eq("month_start", monthStart).maybeSingle();
  if (error) throw error;
  return data as MonthlyBudget | null;
}
export async function saveMonthlyBudget(monthStart: string, limitSatang: number) {
  const id = await userId();
  const { error } = await client().from("monthly_budgets").upsert({ user_id: id, month_start: monthStart, limit_satang: limitSatang }, { onConflict: "user_id,month_start" });
  if (error) throw error;
}
export async function deleteMonthlyBudget(monthStart: string) {
  const id = await userId();
  const { error } = await client().from("monthly_budgets").delete().eq("user_id", id).eq("month_start", monthStart);
  if (error) throw error;
}
