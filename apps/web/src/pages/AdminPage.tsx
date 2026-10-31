import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowDownLeft,
  CircleCheck,
  CircleHelp,
  CircleX,
  ExternalLink,
  Layers,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { getEntriesInRange, summarizeEntries } from "../features/reports/reportApi";
import { CardGardenLedge, CardGinghamOverlay } from "../components/common/CardGrounding";

function bangkokDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(date);
}

function money(satang: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(satang / 100);
}

function thaiDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value.includes("T") ? value : `${value}T12:00:00+07:00`));
}

export function AdminPage() {
  const { profile, configured } = useAuth();
  const today = bangkokDate();
  const monthStart = today.slice(0, 7) + "-01";
  const trendDate = new Date(today + "T12:00:00+07:00");
  trendDate.setDate(trendDate.getDate() - 13);
  const trendStart = bangkokDate(trendDate);

  const users = useQuery({
    queryKey: ["admin", "profiles"],
    enabled: profile?.role === "admin" && configured,
    queryFn: async () => {
      if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,display_name,role,created_at")
        .order("created_at", { ascending: false });
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
  const trendSummary = useMemo(() => summarizeEntries(trend.data ?? []), [trend.data]);

  const chartDays = useMemo(() => {
    const values = new Map(trendSummary.byDay.map((day) => [day.date, day]));
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today + "T12:00:00+07:00");
      date.setDate(date.getDate() - (13 - index));
      const key = bangkokDate(date);
      return values.get(key) ?? { date: key, income: 0, expense: 0 };
    });
  }, [trendSummary.byDay, today]);

  const maxDaily = Math.max(1, ...chartDays.flatMap((day) => [day.income, day.expense]));
  const userList = users.data ?? [];

  const refresh = () => {
    void users.refetch();
    void entries.refetch();
    void trend.refetch();
    void health.refetch();
  };

  const statuses = [
    { name: "ฐานข้อมูล Supabase", ok: health.data?.database },
    { name: "AI / DeepSeek Vault", ok: health.data?.ai },
    { name: "Admin Service Role", ok: health.data?.adminApi },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Overview Card Container (ref-1.png) */}
      <section className="relative bg-gradient-to-b from-[#f9fdfa] via-white to-[#f4faf6] rounded-[32px] p-6 sm:p-8 border border-[#d4e8d8] shadow-[0_12px_40px_rgba(42,78,56,0.05)] space-y-6 overflow-visible">
        <CardGinghamOverlay opacity="opacity-[0.015]" />

        {/* Fluffy Cloud Shelf anchoring the Sleeping Pig */}
        <div className="hidden lg:block absolute -top-2 left-8 w-32 h-4 rounded-full bg-white/90 border border-[#d5eadc] shadow-xs pointer-events-none z-10" />

        {/* Top Garden Ledge Grounding the Frog */}
        <CardGardenLedge className="hidden lg:flex right-12 w-28" />

        {/* Playful Mascots Peeking Over Admin Card (Matching ref-1.png) */}
        <div className="hidden lg:block absolute -top-12 left-10 w-28 h-28 pointer-events-none filter drop-shadow-[0_10px_20px_rgba(30,65,40,0.14)] z-20 transition-transform hover:scale-105">
          <img
            src="/images/mascots/pig-mascot-sleeping.png"
            alt="" aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="hidden lg:block absolute -top-11 right-14 w-24 h-24 pointer-events-none filter drop-shadow-[0_10px_20px_rgba(35,70,45,0.16)] z-20 transition-transform hover:scale-105">
          <img
            src="/images/mascots/frog-mascot-happy.png"
            alt="" aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Section Heading matching ref-1.png */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#edf3ec]">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#819e8a] uppercase">
              OVERVIEW / SYSTEM
            </span>
            <h2 className="text-2xl font-extrabold text-[#23382e] tracking-tight mt-0.5">
              ภาพรวมระบบ
            </h2>
            <p className="text-xs text-[#71877c]">
              ติดตามสถานะสมาชิกและกิจกรรมทางการเงินทั้งหมดในระบบ
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-[#f4f8f3] hover:bg-[#eaf4ec] text-[#36684e] text-xs font-bold border border-[#dce7dc] flex items-center gap-2 transition"
          >
            <RefreshCw size={14} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>

        {!configured && <div className="rounded-2xl border border-[#fbdbe1] bg-[#fff0f2] p-4 text-xs text-[#bd4754]" role="alert">ยังไม่ได้ตั้งค่า Supabase จึงไม่สามารถโหลดข้อมูลภาพรวมระบบได้</div>}
        {(users.isError || entries.isError || trend.isError) && (
          <div className="rounded-2xl border border-[#fbdbe1] bg-[#fff0f2] p-4 text-xs text-[#bd4754]" role="alert">โหลดข้อมูลภาพรวมไม่ครบ: {users.error?.message ?? entries.error?.message ?? trend.error?.message}</div>
        )}

        {/* 4 Stat Cards matching ref-1.png */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. สมาชิกทั้งหมด */}
          <div className="p-5 rounded-3xl bg-[#fbfdfb] border border-[#e3ebe1] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="w-9 h-9 rounded-2xl bg-[#fef5e7] text-[#d97c27] flex items-center justify-center shadow-2xs">
                <Users size={17} strokeWidth={2.2} />
              </span>
              <span className="w-7 h-7 rounded-full bg-[#f2efff] text-[#785ad6] flex items-center justify-center">
                <ShieldCheck size={14} />
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-[#6d8576]">สมาชิกทั้งหมด</span>
              <strong className="block text-2xl font-extrabold text-[#23382e] tabular-nums mt-1">
                {!configured || users.isLoading || users.isError ? "—" : userList.length}
              </strong>
              <small className="block text-[10px] text-[#8fa597] mt-1">จัดการยอดผู้ใช้ในระบบ</small>
            </div>
          </div>

          {/* 2. รายการทั้งหมด */}
          <div className="p-5 rounded-3xl bg-[#fbfdfb] border border-[#e3ebe1] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="w-9 h-9 rounded-2xl bg-[#f2efff] text-[#785ad6] flex items-center justify-center shadow-2xs">
                <Wallet size={17} strokeWidth={2.2} />
              </span>
              <span className="w-7 h-7 rounded-full bg-[#f2efff] text-[#785ad6] flex items-center justify-center">
                <Layers size={14} />
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-[#6d8576]">รายการทั้งหมด</span>
              <strong className="block text-2xl font-extrabold text-[#23382e] tabular-nums mt-1">
                {!configured || entries.isLoading || entries.isError ? "—" : summary.count}
              </strong>
              <small className="block text-[10px] text-[#8fa597] mt-1">ต่อตรงฐานข้อมูลความปลอดภัย</small>
            </div>
          </div>

          {/* 3. ยอดรายเดือนสะสม */}
          <div className="p-5 rounded-3xl bg-[#fbfdfb] border border-[#e3ebe1] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="w-9 h-9 rounded-2xl bg-[#eaf7ee] text-[#289a69] flex items-center justify-center shadow-2xs">
                <TrendingUp size={17} strokeWidth={2.2} />
              </span>
              <span className="w-7 h-7 rounded-full bg-[#eaf7ee] text-[#289a69] flex items-center justify-center">
                <Activity size={14} />
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-[#6d8576]">ยอดรายเดือนสะสม</span>
              <strong className="block text-2xl font-extrabold text-[#23382e] tabular-nums mt-1">
                {!configured || entries.isLoading || entries.isError ? "—" : money(summary.expense)}
              </strong>
              <small className="block text-[10px] text-[#8fa597] mt-1">รวมค่าใช้จ่ายเดือนนี้</small>
            </div>
          </div>

          {/* 4. ยอดรายรับสะสม */}
          <div className="p-5 rounded-3xl bg-[#fbfdfb] border border-[#e3ebe1] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="w-9 h-9 rounded-2xl bg-[#e6f4fc] text-[#268bc9] flex items-center justify-center shadow-2xs">
                <ArrowDownLeft size={17} strokeWidth={2.2} />
              </span>
              <span className="w-7 h-7 rounded-full bg-[#e6f4fc] text-[#268bc9] flex items-center justify-center">
                <Wallet size={14} />
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-[#6d8576]">ยอดรายรับสะสม</span>
              <strong className="block text-2xl font-extrabold text-[#23382e] tabular-nums mt-1">
                {!configured || entries.isLoading || entries.isError ? "—" : money(summary.income)}
              </strong>
              <small className="block text-[10px] text-[#8fa597] mt-1">รวมรายรับเดือนนี้</small>
            </div>
          </div>
        </div>

        {/* Member Table Section matching ref-1.png */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#23382e]">สมาชิกในระบบ</h3>
            <a
              href="/admin/users"
              className="text-xs font-semibold text-[#3b7e5b] hover:text-[#234835] flex items-center gap-1"
            >
              <span>จัดการผู้ใช้ทั้งหมด</span>
              <ExternalLink size={13} />
            </a>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#e5ede3]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8faf7] text-[#71877c] border-b border-[#e5ede3]">
                  <th className="py-3 px-4 font-semibold">บัญชีในระบบ</th>
                  <th className="py-3 px-4 font-semibold">สถานะ / สิทธิ์</th>
                  <th className="py-3 px-4 font-semibold">วันที่เริ่มใช้งาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef4ee]">
                {userList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-[#71877c]">
                      {!configured ? "ยังไม่ได้ตั้งค่า Supabase" : users.isLoading ? "กำลังโหลดข้อมูลสมาชิก..." : users.isError ? "โหลดข้อมูลสมาชิกไม่สำเร็จ" : "ยังไม่มีสมาชิก"}
                    </td>
                  </tr>
                ) : (
                  userList.slice(0, 6).map((member) => {
                    const isAdmin = member.role === "admin";
                    return (
                      <tr key={member.id} className="hover:bg-[#fbfdfb] transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#ebf5ee] border border-[#cde4d5] flex items-center justify-center font-bold text-xs text-[#2c5a42]">
                              {(member.display_name || member.email || "M").slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <strong className="block text-xs font-bold text-[#23382e]">
                                {member.display_name || "ไม่ระบุชื่อ"}
                              </strong>
                              <span className="block text-[11px] text-[#71877c]">{member.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
                              isAdmin
                                ? "bg-[#eaf0fc] text-[#3366cc]"
                                : "bg-[#ebf7ee] text-[#229667]"
                            }`}
                          >
                            {isAdmin ? "Admin" : "Partner"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#668072] font-medium">
                          {thaiDate(member.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 14-Day Trend Chart */}
        <div className="pt-6 border-t border-[#edf3ec]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#23382e]">กิจกรรมและการเงิน</h3>
              <p className="text-xs text-[#71877c]">เปรียบเทียบรายรับและรายจ่ายย้อนหลัง 14 วัน</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-[#668072]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#239667]" /> รายรับ
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dd5e6d]" /> รายจ่าย
              </span>
            </div>
          </div>

          {trend.isLoading ? (
            <div className="h-[180px] flex items-center justify-center gap-2 text-xs text-[#71877c]" role="status"><RefreshCw size={16} className="animate-spin"/>กำลังโหลดกราฟ...</div>
          ) : trend.isError ? (
            <div className="h-[180px] flex items-center justify-center text-xs text-[#bd4754]" role="alert">โหลดกราฟไม่สำเร็จ: {trend.error.message}</div>
          ) : !chartDays.some((day) => day.income > 0 || day.expense > 0) ? (
            <div className="h-[180px] flex items-center justify-center text-xs text-[#71877c]">ยังไม่มีข้อมูลในช่วงนี้</div>
          ) : (
          <div className="h-[180px] flex items-end gap-2 overflow-x-auto pb-2 border-b border-[#edf3ec]">
            {chartDays.map((day) => (
              <div
                key={day.date}
                className="flex-1 min-w-[32px] h-full flex flex-col justify-end items-center gap-1.5"
                title={`${day.date}: รับ ${money(day.income)} / จ่าย ${money(day.expense)}`}
              >
                <div className="w-full flex items-end justify-center gap-1 h-[140px]">
                  <div
                    className="w-2.5 rounded-t-sm bg-[#239667] transition-all"
                    style={{ height: `${Math.max(day.income > 0 ? 4 : 0, (day.income / maxDaily) * 100)}%` }}
                  />
                  <div
                    className="w-2.5 rounded-t-sm bg-[#dd5e6d] transition-all"
                    style={{ height: `${Math.max(day.expense > 0 ? 4 : 0, (day.expense / maxDaily) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-[#8fa597]">{day.date.slice(8)}</span>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* System Health */}
        <div className="pt-4 flex flex-wrap gap-3 items-center justify-between text-xs text-[#71877c]">
          <div className="flex items-center gap-4">
            {statuses.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5 font-medium">
                {!configured ? (
                  <CircleHelp size={14} className="text-[#8fa597]" />
                ) : health.isLoading ? (
                  <RefreshCw size={14} className="animate-spin text-[#8fa597]" />
                ) : s.ok ? (
                  <CircleCheck size={14} className="text-[#239667]" />
                ) : (
                  <CircleX size={14} className="text-[#dd5e6d]" />
                )}
                <span>{s.name}</span>
              </span>
            ))}
          </div>
          <span className="text-[10px] text-[#8fa597]">{health.isError ? "ตรวจสอบสถานะไม่สำเร็จ" : "ตรวจสอบอัตโนมัติ"}</span>
        </div>
      </section>
    </div>
  );
}
