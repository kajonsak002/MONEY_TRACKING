import { supabase } from "../../lib/supabase";
import type { EntryRecord } from "../entries/entriesApi";
function getClient() { if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase"); return supabase; }

/**
 * By default, reports are personal even for Admin accounts. Pass includeAllUsers=true
 * only from the admin overview; PostgreSQL RLS still decides whether the caller can see all rows.
 */
export async function getEntriesInRange(from: string, to: string, includeAllUsers = false): Promise<EntryRecord[]> {
  const client = getClient();
  const all: EntryRecord[] = [];
  const userId = includeAllUsers ? null : (await client.auth.getUser()).data.user?.id;
  if (!includeAllUsers && !userId) throw new Error("กรุณาเข้าสู่ระบบใหม่");
  const pageSize = 500;
  for (let start = 0; ; start += pageSize) {
    let query = client.from("entries")
      .select("id,type,amount_satang,note,occurred_on,category_id,categories(id,name,type,icon,color)")
      .is("deleted_at", null)
      .gte("occurred_on", from).lte("occurred_on", to)
      .order("occurred_on", { ascending: true })
      .range(start, start + pageSize - 1);
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as unknown as EntryRecord[];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}
export interface FinancialSummary {
  income: number; expense: number; balance: number; count: number;
  byDay: Array<{ date: string; income: number; expense: number }>;
  byCategory: Array<{ name: string; amount: number; type: "income" | "expense" }>;
}
export function summarizeEntries(entries: EntryRecord[]): FinancialSummary {
  const days = new Map<string, { date: string; income: number; expense: number }>();
  const categories = new Map<string, { name: string; amount: number; type: "income" | "expense" }>();
  let income = 0; let expense = 0;
  for (const entry of entries) {
    const amount = Number(entry.amount_satang);
    if (!Number.isSafeInteger(amount) || amount <= 0) continue;
    if (entry.type === "income") income += amount; else expense += amount;
    const day = days.get(entry.occurred_on) ?? { date: entry.occurred_on, income: 0, expense: 0 };
    day[entry.type] += amount; days.set(entry.occurred_on, day);
    const relation = Array.isArray(entry.categories) ? entry.categories[0] : entry.categories;
    const name = relation?.name ?? "ไม่ระบุหมวดหมู่";
    const key = `${entry.type}:${name}`;
    const category = categories.get(key) ?? { name, amount: 0, type: entry.type };
    category.amount += amount; categories.set(key, category);
  }
  return { income, expense, balance: income - expense, count: entries.length,
    byDay: [...days.values()].sort((a,b) => a.date.localeCompare(b.date)),
    byCategory: [...categories.values()].sort((a,b) => b.amount - a.amount) };
}
