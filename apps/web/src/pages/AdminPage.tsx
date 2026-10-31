import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowDownLeft, ArrowUpRight, ExternalLink, CircleCheck, CircleX, RefreshCw, ShieldCheck, TrendingUp, Users, Wallet } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { getEntriesInRange, summarizeEntries } from "../features/reports/reportApi";

function bangkokDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(date);
}
function money(satang: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(satang / 100);
}
function shortDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" }).format(new Date(value + "T12:00:00+07:00"));
}
const card = "rounded-[22px] border border-[#e8eee6] bg-white shadow-[0_8px_28px_rgba(47,77,55,0.045)]";
const label = "text-[11px] font-medium text-[#89968d]";
const title = "text-[13px] font-bold text-[#34483d]";

export function AdminPage() {
  const { profile } = useAuth();
  const today = bangkokDate();
  const monthStart = today.slice(0, 7) + "-01";
  const trendDate = new Date(today + "T12:00:00+07:00");
  trendDate.setDate(trendDate.getDate() - 13);
  const trendStart = bangkokDate(trendDate);
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
    queryKey: ["admin", "entries", monthStart, today],
    enabled: profile?.role === "admin" && !!supabase,
    queryFn: () => getEntriesInRange(monthStart, today, true),
  });
  const trend = useQuery({
    queryKey: ["admin", "trend", trendStart, today],
    enabled: profile?.role === "admin" && !!supabase,
    queryFn: () => getEntriesInRange(trendStart, today, true),
  });
  const health = useQuery({
    queryKey: ["admin", "system-health"],
    enabled: profile?.role === "admin" && !!supabase,
    queryFn: async () => {
      if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
      const [database, ai, adminApi] = await Promise.all([
        supabase.from("profiles").select("id").limit(1),
        supabase.functions.invoke("parse-entry", { body: { action: "health" } }),
        supabase.functions.invoke("admin-users", { body: { action: "health" } }),
      ]);
      return {
        database: !database.error,
        ai: !ai.error && ai.data?.ready === true && ai.data?.deepseekConfigured === true,
        adminApi: !adminApi.error && adminApi.data?.ready === true,
      };
    },
    refetchInterval: 60_000,
  });
  const summary = useMemo(() => summarizeEntries(entries.data ?? []), [entries.data]);
  const chartDays = useMemo(() => {
    const values = new Map(summary.byDay.map((day) => [day.date, day]));
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today + "T12:00:00+07:00");
      date.setDate(date.getDate() - (13 - index));
      const key = bangkokDate(date);
      return values.get(key) ?? { date: key, income: 0, expense: 0 };
    });
  }, [trendSummary.byDay, today]);
  const maxDaily = Math.max(1, ...chartDays.flatMap((day) => [day.income, day.expense]));
  const latestMembers = (users.data ?? []).slice(0, 5);
  const latestEntries = (entries.data ?? []).slice(-6).reverse();
  const refresh = () => { void users.refetch(); void entries.refetch(); void trend.refetch(); void health.refetch(); };
  const loading = users.isLoading || entries.isLoading || trend.isLoading;
  const error = users.error?.message ?? entries.error?.message ?? trend.error?.message;
  const statuses = [
    { name: "ฐานข้อมูล Supabase", ok: health.data?.database },
    { name: "AI / DeepSeek", ok: health.data?.ai },
    { name: "Admin API", ok: health.data?.adminApi },
  ];

  return <div className="mx-auto grid w-full max-w-[1480px] gap-6 text-[#34483d]">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-[10px] font-bold tracking-[1.8px] text-[#83a18a]">WORKSPACE / OVERVIEW</p>
        <h1 className="text-[27px] font-bold tracking-[-.8px] text-[#2d4034] sm:text-[32px]">ภาพรวมระบบ</h1>
        <p className="mt-1 text-xs text-[#89968d]">ภาพรวมสมาชิกและกิจกรรมทางการเงินของ MoneyMate</p>
      </div>
      <button type="button" onClick={refresh} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e3eae1] bg-white px-4 text-xs font-semibold text-[#627a68] transition hover:bg-[#f4f8f2]"><RefreshCw size={14}/> รีเฟรชข้อมูล</button>
    </header>

    {(users.isError || entries.isError || trend.isError) && <div role="alert" className="rounded-xl border border-[#f3d6d7] bg-[#fff5f4] px-4 py-3 text-xs text-[#bd6268]">{error || "ไม่สามารถโหลดข้อมูลได้"}</div>}

    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[
        { label: "สมาชิกทั้งหมด", value: loading ? "—" : String(users.data?.length ?? 0), hint: "บัญชีที่ลงทะเบียน", icon: Users, tone: "bg-[#edf5eb] text-[#6b9875]" },
        { label: "รายการเดือนนี้", value: loading ? "—" : summary.count.toLocaleString("th-TH"), hint: "รายการที่ยังไม่ถูกลบ", icon: Wallet, tone: "bg-[#eef3fb] text-[#7291bf]" },
        { label: "รายรับเดือนนี้", value: loading ? "—" : money(summary.income), hint: "รวมรายการรายรับ", icon: TrendingUp, tone: "bg-[#eaf6ef] text-[#42936c]" },
        { label: "รายจ่ายเดือนนี้", value: loading ? "—" : money(summary.expense), hint: "รวมรายการรายจ่าย", icon: Activity, tone: "bg-[#fff0ef] text-[#d77b7f]" },
      ].map((item) => <article key={item.label} className={`${card} min-w-0 p-4 sm:p-5`}>
        <div className="flex items-center justify-between gap-2"><span className={label}>{item.label}</span><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.tone}`}><item.icon size={17}/></span></div>
        <strong className="mt-4 block break-words text-[clamp(18px,2vw,25px)] font-bold tracking-[-.5px] text-[#34483d] tabular-nums">{item.value}</strong>
        <small className="mt-1 block text-[10px] text-[#a0aaa2]">{item.hint}</small>
      </article>)}
    </section>

    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,.85fr)]">
      <article className={`${card} min-w-0 p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className={title}>กระแสเงินเข้า–ออก</h2><p className="mt-1 text-[10px] text-[#9aa59d]">เปรียบเทียบรายรับและรายจ่ายย้อนหลัง 14 วัน</p></div>
          <div className="flex gap-3 text-[10px] text-[#859188]"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#78ad8b]"/>รายรับ</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#e7a0a0]"/>รายจ่าย</span></div>
        </div>
        <div className="mt-6 grid h-[190px] grid-cols-14 items-end gap-1.5 sm:gap-3">
          {chartDays.map((day) => <div key={day.date} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
            <div className="flex h-[158px] w-full items-end justify-center gap-[3px] border-b border-[#edf1eb]">
              <div title={`รายรับ ${money(day.income)}`} className="w-[42%] max-w-4 rounded-t-md bg-[#78ad8b] transition-all" style={{ height: `${Math.max(day.income > 0 ? 3 : 0, day.income / maxDaily * 100)}%` }}/>
              <div title={`รายจ่าย ${money(day.expense)}`} className="w-[42%] max-w-4 rounded-t-md bg-[#e7a0a0] transition-all" style={{ height: `${Math.max(day.expense > 0 ? 3 : 0, day.expense / maxDaily * 100)}%` }}/>
            </div>
            <small className="text-[8px] text-[#9aa59d] sm:text-[9px]">{indexLabel(day.date)}</small>
          </div>)}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#eff2ed] pt-4">
          <div><span className={label}>รายรับสุทธิ</span><strong className="mt-1 block text-sm font-bold text-[#42936c]">{money(summary.income)}</strong></div>
          <div><span className={label}>รายจ่ายสุทธิ</span><strong className="mt-1 block text-sm font-bold text-[#d77b7f]">{money(summary.expense)}</strong></div>
        </div>
      </article>

      <article className={`${card} p-5 sm:p-6`}>
        <h2 className={title}>สัดส่วนการเงิน</h2><p className="mt-1 text-[10px] text-[#9aa59d]">ภาพรวมของเดือนนี้</p>
        <div className="mt-7 grid place-items-center">
          <div className="relative grid h-[164px] w-[164px] place-items-center rounded-full" style={{ background: `conic-gradient(#78ad8b 0deg ${(summary.income + summary.expense) > 0 ? summary.income / (summary.income + summary.expense) * 360 : 0}deg, #e7a0a0 0deg)` }}>
            <div className="grid h-[124px] w-[124px] place-items-center rounded-full bg-white text-center"><div><strong className="block text-xl font-bold text-[#34483d]">{summary.count}</strong><span className="text-[10px] text-[#9aa59d]">รายการ</span></div></div>
          </div>
        </div>
        <div className="mt-6 grid gap-3">
          <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs text-[#78877d]"><i className="h-2.5 w-2.5 rounded-full bg-[#78ad8b]"/>รายรับ</span><strong className="text-xs text-[#42936c]">{money(summary.income)}</strong></div>
          <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs text-[#78877d]"><i className="h-2.5 w-2.5 rounded-full bg-[#e7a0a0]"/>รายจ่าย</span><strong className="text-xs text-[#d77b7f]">{money(summary.expense)}</strong></div>
        </div>
      </article>
    </section>

    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
      <article className={`${card} min-w-0 p-5 sm:p-6`}>
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className={title}>รายการล่าสุด</h2><p className="mt-1 text-[10px] text-[#9aa59d]">รายการที่บันทึกในเดือนนี้</p></div><a href="/admin/transactions" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#70967a] hover:text-[#456d50]">ดูทั้งหมด <ArrowUpRightFromSquare size={13}/></a></div>
        {entries.isLoading ? <p className="py-8 text-center text-xs text-[#9aa59d]">กำลังโหลดรายการ...</p> : latestEntries.length === 0 ? <p className="py-8 text-center text-xs text-[#9aa59d]">ยังไม่มีรายการในเดือนนี้</p> : <div className="divide-y divide-[#eff2ed]">
          {latestEntries.map((entry) => <div key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${entry.type === "income" ? "bg-[#eaf6ef] text-[#42936c]" : "bg-[#fff0ef] text-[#d77b7f]"}`}>{entry.type === "income" ? <ArrowDownLeft size={17}/> : <ArrowUpRight size={17}/>}</span>
            <div className="min-w-0 flex-1"><strong className="block truncate text-xs font-semibold text-[#526257]">{entry.note || "รายการ"}</strong><small className="text-[10px] text-[#a0aaa2]">{shortDate(entry.occurred_on)}</small></div>
            <strong className={`whitespace-nowrap text-xs font-bold tabular-nums ${entry.type === "income" ? "text-[#42936c]" : "text-[#d77b7f]"}`}>{entry.type === "income" ? "+" : "−"}{money(entry.amount_satang)}</strong>
          </div>)}
        </div>}
      </article>

      <article className={`${card} min-w-0 p-5 sm:p-6`}>
        <div className="mb-4 flex items-center justify-between"><div><h2 className={title}>สมาชิกใหม่</h2><p className="mt-1 text-[10px] text-[#9aa59d]">บัญชีที่สมัครล่าสุด</p></div><a href="/admin/users" className="text-[11px] font-semibold text-[#70967a]">จัดการสมาชิก</a></div>
        {users.isLoading ? <p className="py-8 text-center text-xs text-[#9aa59d]">กำลังโหลดสมาชิก...</p> : latestMembers.length === 0 ? <p className="py-8 text-center text-xs text-[#9aa59d]">ยังไม่มีสมาชิก</p> : <div className="divide-y divide-[#eff2ed]">
          {latestMembers.map((member) => <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#edf5eb] text-xs font-bold text-[#70967a]">{(member.display_name || member.email || "M").slice(0,1).toUpperCase()}</span>
            <div className="min-w-0 flex-1"><strong className="block truncate text-xs font-semibold text-[#526257]">{member.display_name || "ไม่ระบุชื่อ"}</strong><small className="block truncate text-[10px] text-[#a0aaa2]">{member.email}</small></div>
            <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${member.role === "admin" ? "bg-[#edf1fa] text-[#7187b2]" : "bg-[#edf6ed] text-[#6c9875]"}`}>{member.role === "admin" ? "Admin" : "Member"}</span>
          </div>)}
        </div>}
      </article>
    </section>

    <section className={`${card} p-5 sm:p-6`}>
      <div className="mb-4 flex items-center justify-between"><div><h2 className={title}>สถานะบริการ</h2><p className="mt-1 text-[10px] text-[#9aa59d]">ตรวจสอบอัตโนมัติทุก 60 วินาที</p></div><ShieldCheck size={19} className="text-[#83a18a]"/></div>
      {health.isLoading ? <p className="text-xs text-[#9aa59d]">กำลังตรวจสอบระบบ...</p> : health.isError ? <p role="alert" className="text-xs text-[#c66c73]">{health.error.message}</p> : <div className="grid gap-2 sm:grid-cols-3">{statuses.map((status) => <div key={status.name} className="flex items-center justify-between gap-2 rounded-xl bg-[#f8faf7] px-3 py-3"><span className="text-[11px] text-[#728076]">{status.name}</span><span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${status.ok ? "text-[#4c9a70]" : "text-[#d47b7b]"}`}>{status.ok ? <CircleCheck size={14}/> : <CircleX size={14}/>}{status.ok ? "พร้อมใช้งาน" : "ไม่พร้อม"}</span></div>)}</div>}
    </section>
    <p className="flex items-start gap-2 text-[10px] leading-5 text-[#98a39a]"><ShieldCheck size={14} className="mt-0.5 shrink-0"/> Admin ใช้สำหรับตรวจสอบภาพรวมเท่านั้น การเข้าถึงข้อมูลจริงยังถูกควบคุมด้วย Supabase Row Level Security (RLS) และ Edge Function ตามสิทธิ์ของบัญชี</p>
  </div>;
}

function indexLabel(date: string) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", timeZone: "Asia/Bangkok" }).format(new Date(date + "T12:00:00+07:00"));
}
