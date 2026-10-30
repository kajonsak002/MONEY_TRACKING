import { useQuery } from "@tanstack/react-query";
import { Activity, RefreshCw, Users, Wallet, ShieldCheck, TrendingUp } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { getEntriesInRange } from "../features/reports/reportApi";

function currentDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}
function money(value: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(value);
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
  const refresh = () => { void users.refetch(); void entries.refetch(); };
  const totalIncome = (entries.data ?? []).filter((e) => e.type === "income").reduce((sum, e) => sum + Number(e.amount_satang), 0) / 100;
  const totalExpense = (entries.data ?? []).filter((e) => e.type === "expense").reduce((sum, e) => sum + Number(e.amount_satang), 0) / 100;
  const isLoading = users.isLoading || entries.isLoading;
  const isError = users.isError || entries.isError;
  const error = users.error?.message ?? entries.error?.message;
  return <div className="admin-overview">
    <header className="admin-heading"><div><span className="admin-eyebrow">OVERVIEW / SYSTEM</span><h1>ภาพรวมระบบ</h1><p>ติดตามสถานะสมาชิกและข้อมูลการใช้งาน MONEY TRACKING</p></div><button className="admin-refresh" onClick={refresh}><RefreshCw size={14}/> รีเฟรชข้อมูล</button></header>
    {isError && <p className="entry-error">{error || "ไม่สามารถโหลดข้อมูลได้"}</p>}
    <section className="admin-kpis">
      <article className="admin-kpi"><div className="admin-kpi-top"><span>สมาชิกทั้งหมด</span><span className="admin-kpi-icon"><Users size={17}/></span></div><strong>{isLoading ? "—" : users.data?.length ?? 0}</strong><small>บัญชีที่มีโปรไฟล์ในระบบ</small></article>
      <article className="admin-kpi"><div className="admin-kpi-top"><span>รายการทั้งหมด</span><span className="admin-kpi-icon"><Wallet size={17}/></span></div><strong>{isLoading ? "—" : entries.data?.length ?? 0}</strong><small>รายการที่อ่านได้ตามสิทธิ์ Admin</small></article>
      <article className="admin-kpi"><div className="admin-kpi-top"><span>ยอดรายรับสะสม</span><span className="admin-kpi-icon"><TrendingUp size={17}/></span></div><strong>{isLoading ? "—" : money(totalIncome)}</strong><small>คำนวณจากรายการที่อ่านได้</small></article>
      <article className="admin-kpi"><div className="admin-kpi-top"><span>ยอดรายจ่ายสะสม</span><span className="admin-kpi-icon"><Activity size={17}/></span></div><strong>{isLoading ? "—" : money(totalExpense)}</strong><small>คำนวณจากรายการที่อ่านได้</small></article>
    </section>
    <section className="admin-panel"><div className="admin-panel-head"><h2>สมาชิกในระบบ</h2><small>{users.data?.length ?? 0} บัญชี</small></div>
      {isLoading ? <div className="admin-empty">กำลังโหลดข้อมูล...</div> : isError ? <div className="admin-empty">ไม่สามารถโหลดสมาชิกได้</div> : !users.data?.length ? <div className="admin-empty">ยังไม่มีสมาชิก</div> :
      <table className="admin-member-table"><thead><tr><th>ชื่อ / อีเมล</th><th>สิทธิ์</th><th>วันที่สมัคร</th></tr></thead><tbody>{users.data.map((member) => <tr key={member.id}><td><strong>{member.display_name || "ไม่ระบุชื่อ"}</strong><br/><span>{member.email}</span></td><td><span className={member.role === "admin" ? "admin-role admin" : "admin-role partner"}>{member.role === "admin" ? "Admin" : "Partner"}</span></td><td>{member.created_at ? new Intl.DateTimeFormat("th-TH",{dateStyle:"medium"}).format(new Date(member.created_at)) : "—"}</td></tr>)}</tbody></table>}
    </section>
    <section className="admin-panel"><div className="admin-panel-head"><h2>ความปลอดภัยและสิทธิ์</h2><ShieldCheck size={17}/></div><p style={{margin:0,color:"#718096",fontSize:11,lineHeight:1.8}}>การแยกหน้าจอ Admin/Partner เป็นเพียงประสบการณ์ใช้งาน ส่วนการอนุญาตอ่านและเขียนข้อมูลยังบังคับด้วย Supabase Row Level Security (RLS) ทุกคำขอ</p></section>
  </div>;
}