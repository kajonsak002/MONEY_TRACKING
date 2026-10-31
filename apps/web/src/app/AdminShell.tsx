import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  Bell,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";

const items = [
  { to: "/admin", label: "ภาพรวมระบบ", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "ผู้ใช้งาน", icon: Users },
  { to: "/admin/transactions", label: "รายการทั้งหมด", icon: Wallet },
  { to: "/admin/activity", label: "กิจกรรมระบบ", icon: Activity },
  { to: "/admin/settings", label: "ตั้งค่าระบบ", icon: Settings },
];

export function AdminShell() {
  const { profile, user, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("admin-sidebar-collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appName, setAppName] = useState("MONEY TRACKING");

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const load = async () => {
      const { data } = await client.from("app_settings").select("key,value").eq("key", "app_name").maybeSingle();
      if (typeof data?.value === "string" && data.value.trim()) setAppName(data.value);
    };
    void load();
    const refresh = () => void load();
    window.addEventListener("app-settings-updated", refresh);
    return () => window.removeEventListener("app-settings-updated", refresh);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (profile?.role !== "admin") return <Navigate to="/app" replace />;

  function toggleSidebar() {
    setCollapsed((current) => {
      localStorage.setItem("admin-sidebar-collapsed", String(!current));
      return !current;
    });
  }

  const displayName = profile.display_name || user?.email?.split("@")[0] || "ผู้ดูแลระบบ";

  return (
    <div className="min-h-screen bg-[#f3f7f2] flex relative overflow-x-hidden antialiased text-[#24392f]">
      {/* Decorative Mascot in Corner (Matching ref-1.png) */}
      <div className="fixed -top-4 right-16 w-32 h-32 pointer-events-none opacity-80 z-0 hidden xl:block">
        <img
          src="/images/mascots/frog-mascot-happy.png"
          alt=""
          className="w-full h-full object-contain filter drop-shadow-md"
        />
      </div>

      <div className="fixed bottom-4 left-64 w-32 h-32 pointer-events-none opacity-85 z-0 hidden 2xl:block">
        <img
          src="/images/mascots/pig-mascot-sleeping.png"
          alt=""
          className="w-full h-full object-contain filter drop-shadow-md"
        />
      </div>

      {/* ================= FLOATING WHITE SIDEBAR (ref-1.png) ================= */}
      <aside
        className={`fixed top-4 bottom-4 left-4 z-40 bg-white/95 backdrop-blur-md rounded-[32px] border border-[#e2ece0] shadow-[0_12px_40px_rgba(42,78,56,0.06)] p-5 flex flex-col justify-between transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } hidden lg:flex`}
      >
        <div className="space-y-6">
          {/* Logo */}
          <NavLink to="/admin" className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-2xl bg-[#ebf5ee] border border-[#cce4d4] flex items-center justify-center p-1 shadow-2xs shrink-0">
              <img
                src="/images/mascots/pig-mascot-happy.png"
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold text-sm text-[#23382e] tracking-tight">{appName}</span>
                <span className="text-[9px] text-[#71877c] font-bold tracking-widest uppercase">ADMIN CONSOLE</span>
              </div>
            )}
          </NavLink>

          {/* Section caption */}
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-[#8fa597] tracking-wider uppercase">
              จัดการข้อมูล
            </p>
          )}

          {/* Nav items */}
          <nav className="space-y-1.5" aria-label="เมนูผู้ดูแล">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={Boolean(end)}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#fdf0f2] text-[#d65e6c] border border-[#fbdbe1] shadow-2xs"
                      : "text-[#6b8577] hover:bg-[#f4f8f3] hover:text-[#23382e]"
                  }`
                }
              >
                <Icon size={18} strokeWidth={2.2} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Bottom Profile */}
        <div className="space-y-3 pt-4 border-t border-[#edf3ec]">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-1 text-[11px] font-semibold text-[#668072]">
              <ShieldCheck size={14} className="text-[#3b805c]" />
              <span>Admin access</span>
            </div>
          )}

          <div className="flex items-center justify-between p-2 rounded-2xl bg-[#f8faf7] border border-[#e5ece2]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#ebf5ee] border border-[#cbe4d4] flex items-center justify-center font-bold text-xs text-[#2c5a42] shrink-0">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <strong className="block truncate text-xs font-bold text-[#23382e]">
                    {displayName}
                  </strong>
                  <span className="block truncate text-[10px] text-[#71877c]">
                    {user?.email}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => void signOut()}
              className="p-1.5 text-[#71877c] hover:text-rose-600 rounded-lg transition"
              title="ออกจากระบบ"
            >
              <LogOut size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="w-full py-1 text-[#8fa597] hover:text-[#23382e] flex items-center justify-center transition"
            title={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
          >
            <ChevronLeft size={16} className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${
          collapsed ? "lg:pl-28" : "lg:pl-72"
        }`}
      >
        {/* Topbar matching ref-1.png */}
        <header className="flex items-center justify-between px-6 lg:px-10 py-5 sticky top-0 z-30 bg-[#f3f7f2]/90 backdrop-blur-md">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 rounded-xl bg-white border border-[#e2ebe0] text-[#4d6e5c]"
            aria-label="เปิดเมนู"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Breadcrumb pill & Center Title (ref-1.png) */}
          <div className="flex flex-col items-start lg:items-center mx-auto">
            <span className="text-[10px] font-bold tracking-wider px-3 py-0.5 rounded-full bg-white border border-[#e2ece0] text-[#6b8577] shadow-2xs mb-1 uppercase">
              {appName} / ADMIN
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#23382e] tracking-tight">
              ศูนย์จัดการระบบ
            </h1>
          </div>

          {/* Right Status Pill & Bell */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#e2ece0] text-xs font-bold text-[#2d5d44] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#239667] animate-pulse" />
              <span>ระบบจัดการ</span>
            </div>

            <div className="w-9 h-9 rounded-full bg-white border border-[#e2ece0] flex items-center justify-center text-[#557163] shadow-2xs cursor-pointer hover:bg-[#ebf5ee] transition">
              <Bell size={16} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto relative z-10 animate-fade-in pb-16">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="ปิดเมนูผู้ดูแล"
          />
          <aside role="dialog" aria-modal="true" aria-label="เมนูผู้ดูแล" className="fixed inset-y-0 left-0 z-50 w-72 bg-white p-5 flex flex-col justify-between shadow-2xl lg:hidden">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-base text-[#23382e]">{appName} ADMIN</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="p-1 text-[#71877c]">
                  <X size={20} />
                </button>
              </div>
              <nav className="space-y-1.5">
                {items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={Boolean(end)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[#fdf0f2] text-[#d65e6c] border border-[#fbdbe1]"
                          : "text-[#6b8577] hover:bg-[#f4f8f3]"
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold flex items-center justify-center gap-2"
            >
              <LogOut size={15} />
              <span>ออกจากระบบ</span>
            </button>
          </aside>
        </>
      )}
    </div>
  );
}
