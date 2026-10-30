import { supabase } from "../../lib/supabase";

export type EntryType = "income" | "expense";
export interface EntryCategory { id: string; name: string; type: EntryType; icon: string; color: string; }
export interface EntryRecord { id: string; type: EntryType; amount_satang: number; note: string | null; occurred_on: string; category_id: string | null; categories: EntryCategory | EntryCategory[] | null; }
export interface CreateEntryInput { type: EntryType; amount_satang: number; note: string; occurred_on: string; category_id: string | null; }
function getClient() { if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase"); return supabase; }
export async function getCategories() {
 const {data,error}=await getClient().from("categories").select("id,name,type,icon,color").order("name");
 if(error) throw error; return (data??[]) as EntryCategory[];
}
export async function getEntries() {
 const {data,error}=await getClient().from("entries").select("id,type,amount_satang,note,occurred_on,category_id,categories(id,name,type,icon,color)").is("deleted_at",null).order("occurred_on",{ascending:false}).order("created_at",{ascending:false}).limit(100);
 if(error) throw error; return (data??[]) as unknown as EntryRecord[];
}
export async function createEntry(input: CreateEntryInput) {
 const db=getClient(); const {data:{user},error:userError}=await db.auth.getUser();
 if(userError||!user) throw new Error("กรุณาเข้าสู่ระบบใหม่");
 const {error}=await db.from("entries").insert({...input,user_id:user.id}); if(error) throw error;
}
export async function softDeleteEntry(id: string) {
 const {error}=await getClient().from("entries").update({deleted_at:new Date().toISOString()}).eq("id",id); if(error) throw error;
}
