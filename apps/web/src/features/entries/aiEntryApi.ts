import { supabase } from "../../lib/supabase";
import type { EntryType } from "./entriesApi";

export interface AiEntryDraft {
  type: EntryType | null;
  amount_thb: number | null;
  occurred_on: string;
  category_name: string | null;
  note: string;
  confidence: number;
}

export async function parseEntryText(text: string): Promise<AiEntryDraft> {
  if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("กรุณาเข้าสู่ระบบก่อนใช้ AI");
  const { data, error } = await supabase.functions.invoke("parse-entry", { body: { text } });
  if (error) throw new Error(error.message || "AI ไม่สามารถอ่านรายการได้");
  if (!data?.draft) throw new Error(data?.error || "AI ไม่สามารถอ่านรายการได้");
  return data.draft as AiEntryDraft;
}
