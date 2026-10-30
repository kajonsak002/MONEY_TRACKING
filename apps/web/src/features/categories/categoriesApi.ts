import { supabase } from "../../lib/supabase";
import type { EntryCategory, EntryType } from "../entries/entriesApi";

function client() {
  if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  return supabase;
}

export async function createCategory(input: { name: string; type: EntryType }) {
  const db = client();
  const { data: { user }, error: userError } = await db.auth.getUser();
  if (userError || !user) throw new Error("กรุณาเข้าสู่ระบบใหม่");
  const { error } = await db.from("categories").insert({
    user_id: user.id, name: input.name.trim(), type: input.type,
    icon: input.type === "income" ? "wallet" : "tag", color: "brand", is_default: false,
  });
  if (error) throw error;
}

export async function updateCategory(id: string, name: string) {
  const { error } = await client().from("categories").update({ name: name.trim() }).eq("id", id).eq("is_default", false);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await client().from("categories").delete().eq("id", id).eq("is_default", false);
  if (error) throw error;
}

export async function getManagedCategories(): Promise<Array<EntryCategory & { is_default: boolean }>> {
  const { data, error } = await client().from("categories")
    .select("id,name,type,icon,color,is_default").order("type").order("name");
  if (error) throw error;
  return (data ?? []) as Array<EntryCategory & { is_default: boolean }>;
}
