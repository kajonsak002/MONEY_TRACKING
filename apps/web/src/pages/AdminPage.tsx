import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, Users, Wallet } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { getEntriesInRange } from "../features/reports/reportApi";

function currentDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}
export function AdminPage() {
  const { profile } = useAuth();
  const users = useQuery({
    queryKey: ["admin", "profiles"],
    enabled: profile?.role === "admin" && !!supabase,
    queryFn: async () => {
      if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
      const { data, error } = await supabase.from("profiles").select("id,email,display_name,role,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const entries = useQuery({
    queryKey: ["admin", "entries", currentDate()],
    enabled: profile?.role === "admin",
    queryFn: () => getEntriesInRange("2000-01-01", currentDate()),
  });
  if (profile?.role !== "admin") return <div className="settings-card"><h1>ไม่มีสิทธิ์เข้าถึง</h1><p className="muted">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p></div>;
  return <div className="settings-page"><header className="page-title-row"><div><p className="eyebrow">ADMIN CONSOLE</p><h1>จัดการระบบ</h1><p className="muted">ภาพรวมสมาชิกและรายการทั้งหมดที่คุณมีสิทธิ์ดู</p></div></header>
    <section className="report-stats"><article><span className="report-stat-icon"><Users size={17}/></span><small>สมาชิกทั้งหมด</small><strong>{users.data?.length ?? "—"}</strong></article><article><span className="report-stat-icon"><Wallet size={17}/></span><small>รายการที่ใช้งาน</small><strong>{entries.data?.length ?? "—"}</strong></article></section>
    {users.isLoading || entries.isLoading ? <div className="entry-loading"><LoaderCircle className="spin"/> กำลังโหลด...</div> : users.isError || entries.isError ? <p className="entry-error">{(users.error || entries.error as Error)?.message}</p> :
    <section className="settings-card"><h2>สมาชิก</h2>{(users.data ?? []).map((member) => <div className="admin-member-row" key={member.id}><div><strong>{member.display_name || "ไม่ระบุชื่อ"}</strong><small>{member.email}</small></div><span className={member.role === "admin" ? "ui-badge ui-badge--brand" : "ui-badge ui-badge--neutral"}>{member.role === "admin" ? "Admin" : "Partner"}</span></div>)}</section>}
    <p className="muted">สิทธิ์การเข้าถึงข้อมูลถูกควบคุมโดย Supabase RLS ไม่ใช่การซ่อนเมนูบนหน้าเว็บ</p>
  </div>;
}
