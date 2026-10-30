import { supabase } from "../../lib/supabase";
import type { EntryCategory, EntryType } from "../entries/entriesApi";
function client() { if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase"); return supabase; }
async function ownerId() {
  const { data: { user }, error } = await client().auth.getUser();
  if (error || !user) throw new Error("กรุณาเข้าสู่ระบบใหม่");
  return user.id;
}
export async function createCategory(input: { name: string; type: EntryType }) {
  const userId = await ownerId();
  const { error } = await client().from("categories").insert({ user_id: userId, name: input.name.trim(), type: input.type, icon: input.type === "income" ? "wallet" : "tag", color: "brand", is_default: false });
  if (error) throw error;
}
export async function updateCategory(id: string, name: string) {
  const userId = await ownerId();
  const { error } = await client().from("categories").update({ name: name.trim() }).eq("id", id).eq("user_id", userId).eq("is_default", false);
  if (error) throw error;
}
export async function deleteCategory(id: string) {
  const userId = await ownerId();
  const { error } = await client().from("categories").delete().eq("id", id).eq("user_id", userId).eq("is_default", false);
  if (error) throw error;
}
export async function getManagedCategories(): Promise<Array<EntryCategory & { is_default: boolean }>> {
  const userId = await ownerId();
  const { data, error } = await client().from("categories").select("id,name,type,icon,color,is_default").eq("user_id", userId).order("type").order("name");
  if (error) throw error;
  return (data ?? []) as Array<EntryCategory & { is_default: boolean }>;
}
