import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  House,
  LogOut,
  Settings,
  ShieldCheck,
  Tags,
  Target,
  Wallet,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";

const navItems = [
  { to: "/app", label: "หน้าหลัก", icon: House, end: true },
  { to: "/app/entries", label: "รายรับรายจ่าย", icon: Wallet },
  { to: "/app/summary", label: "สรุปข้อมูล", icon: BarChart3 },
  { to: "/app/budget", label: "งบประมาณ", icon: Target },
  { to: "/app/categories", label: "หมวดหมู่", icon: Tags },
  { to: "/app/settings", label: "ตั้งค่า", icon: Settings },
];

function bangkokDateThai() {
  const parts = new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).formatToParts(new Date());
  const day = parts.find((p) => p.type === "day")?.value || "";
  const month = parts.find((p) => p.type === "month")?.value || "";
  const year = parts.find((p) => p.type === "year")?.value || "";
  return `${day} ${month} ${year}`;
}

export function AppShell() {
  const { profile, user, signOut } = useAuth();
  const location = useLocation();
  const [appName, setAppName] = useState("Money Tracking");
  const todayFormatted = bangkokDateThai();

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const load = async () => {
      const { data } = await client
        .from("app_settings")
        .select("key,value")
        .in("key", ["app_name"]);
      for (const row of data ?? []) {
        if (row.key === "app_name" && typeof row.value === "string" && row.value.trim()) {
          setAppName(row.value);
        }
      }
    };
    void load();
    window.addEventListener("app-settings-updated", load);
    return () => window.removeEventListener("app-settings-updated", load);
  }, []);

  if (profile?.role === "admin" && location.pathname.startsWith("/app")) {
    // If admin explicitly visits /app, they can use it, but default admin shell is /admin
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "kajonsak";
  const roleLabel = profile?.role === "admin" ? "Admin" : "Partner";

  return (
    <div className="min-h-screen bg-[#f4f7f2] flex flex-col lg:flex-row text-[#24392f] antialiased">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#234835] text-white shrink-0 p-5 min-h-screen border-r border-[#1e3e2d] justify-between">
        <div className="space-y-6">
          {/* Brand */}
          <NavLink to="/app" className="flex items-center gap-3 px-2 py-2 group">
            <div className="w-11 h-11 rounded-2xl bg-[#fdf0f2] border border-[#fbdbe1] p-1 shrink-0 flex items-center justify-center shadow-sm">
              <img
                src="/images/mascots/pig-mascot-happy.png"
                alt="MoneyMate Logo"
                className="w-9 h-9 object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-lg text-white tracking-tight">{appName}</span>
              <span className="text-[10px] text-[#8cbda1] font-semibold tracking-wider uppercase">Finance Mate</span>
            </div>
          </NavLink>

          {/* Nav Links */}
          <nav className="space-y-1.5" aria-label="เมนูหลัก">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={Boolean(end)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#35634a] text-white shadow-sm shadow-[#1a3828]/30 font-bold"
                      : "text-[#b2cdbe] hover:bg-[#2b543e] hover:text-white"
                  }`
                }
              >
                <Icon size={18} strokeWidth={2} />
                <span>{label}</span>
              </NavLink>
            ))}

            {profile?.role === "admin" && (
              <NavLink
                to="/admin"
                className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold text-[#f8b2bd] hover:bg-[#2b543e] hover:text-white transition-all mt-4"
              >
                <ShieldCheck size={18} strokeWidth={2} />
                <span>ศูนย์จัดการระบบ</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Profile Card at Bottom of Sidebar */}
        <div className="pt-4 border-t border-[#315742]">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#1c3a2b]/70 border border-[#2d5740]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#ebf5ee] border border-[#c4e3cf] p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src="/images/mascots/frog-mascot-happy.png"
                  alt={displayName}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="min-w-0">
                <strong className="block truncate text-xs font-semibold text-white">
                  {displayName}
                </strong>
                <span className="inline-block text-[10px] font-medium text-[#8ac7a4]">
                  {roleLabel}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="p-2 text-[#9bb8a7] hover:text-white hover:bg-[#2c533e] rounded-xl transition"
              title="ออกจากระบบ"
              aria-label="ออกจากระบบ"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Desktop Topbar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-[#e5ede3] bg-[#f4f7f2]/90 backdrop-blur-md sticky top-0 z-30">
          <div>
            <h2 className="text-xl font-bold text-[#22392f] leading-snug">
              สวัสดีครับ 👋
            </h2>
            <p className="text-xs text-[#70867a]">
              มาสรุปรายรับรายจ่ายกันนะ 🌿
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e2ebe0] text-xs font-semibold text-[#506c5e] shadow-sm">
              <Calendar size={14} className="text-[#438765]" />
              <span>{todayFormatted}</span>
            </div>


          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3.5 bg-white border-b border-[#e5ede3] sticky top-0 z-30 shadow-xs">
          <NavLink to="/app" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#fdf0f2] border border-[#fbdbe1] p-0.5 flex items-center justify-center">
              <img
                src="/images/mascots/pig-mascot-happy.png"
                alt="" aria-hidden="true"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-[#22392f] leading-tight">{appName}</span>
              <span className="text-[9px] text-[#70867a] font-medium leading-none">Finance Mate</span>
            </div>
          </NavLink>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f4f7f2] border border-[#e2ebe0] text-[11px] font-medium text-[#506c5e]">
              <Calendar size={12} className="text-[#438765]" />
              <span>{todayFormatted}</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-[#ebf5ee] border border-[#c4e3cf] p-0.5 flex items-center justify-center overflow-hidden">
              <img
                src="/images/mascots/frog-mascot-happy.png"
                alt="" aria-hidden="true"
                className="w-7 h-7 object-contain"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto pb-28 lg:pb-12 animate-fade-in">
          <Outlet />
        </main>

        {/* Mobile Floating Bottom Navigation */}
        <nav
          className="lg:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+8px)] left-2 right-2 z-40 max-w-xl mx-auto bg-white/95 backdrop-blur-lg border border-[#e2ece0] rounded-3xl p-1.5 shadow-[0_12px_36px_rgba(35,65,45,0.12)] flex items-center gap-1"
          aria-label="เมนูมือถือ"
        >
          {navItems.filter(({ to }) => to !== "/app/categories").map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={Boolean(end)}
              className={({ isActive }) =>
                `flex flex-1 min-w-0 min-h-[48px] flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all ${
                  isActive
                    ? "bg-[#ebf5ee] text-[#2c5a42] font-bold shadow-xs"
                    : "text-[#7a9084] hover:text-[#2c5a42]"
                }`
              }
            >
              <Icon size={19} strokeWidth={2} />
              <span className="text-[9px] sm:text-[10px] mt-0.5 whitespace-nowrap">{label === "รายรับรายจ่าย" ? "รายการ" : label === "สรุปข้อมูล" ? "สรุป" : label === "งบประมาณ" ? "งบ" : label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
