import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { Activity, ChevronLeft, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Users, Wallet, X } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import "../admin-theme.css";

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
      const { data } = await client.from("app_settings").select("key,value").eq("key","app_name").maybeSingle();
      if (typeof data?.value === "string" && data.value.trim()) setAppName(data.value);
    };
    void load();
    const refresh = () => void load();
    window.addEventListener("app-settings-updated", refresh);
    return () => window.removeEventListener("app-settings-updated", refresh);
  }, []);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  if (profile?.role !== "admin") return <Navigate to="/app" replace />;
  function toggleSidebar() {
    setCollapsed((current) => {
      localStorage.setItem("admin-sidebar-collapsed", String(!current));
      return !current;
    });
  }
  return <div className={`admin-frame${collapsed ? " sidebar-collapsed" : ""}${mobileOpen ? " sidebar-open" : ""}`}>
    <aside className="admin-sidebar">
      <a className="admin-brand" href="/admin"><span className="admin-brand-icon mascot-admin-brand"><img src="/assets/mascot-frog.svg" alt="" /></span><span>{appName}<span>ADMIN CONSOLE</span></span></a>
      <p className="admin-nav-caption">WORKSPACE</p>
      <nav className="admin-nav">{items.map(({to,label,icon:Icon,end}) => <NavLink key={to} to={to} end={Boolean(end)} title={collapsed ? label : undefined} className={({isActive})=>isActive?"admin-nav-link active":"admin-nav-link"}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <div className="admin-sidebar-bottom"><span className="admin-secure"><ShieldCheck size={15}/> Admin access</span><div className="admin-user"><span className="admin-avatar">{(profile.display_name || user?.email || "A").slice(0,1).toUpperCase()}</span><span><strong>{profile.display_name || "ผู้ดูแลระบบ"}</strong><small>{user?.email}</small></span></div><button className="admin-logout" onClick={() => void signOut()}><LogOut size={16}/><span>ออกจากระบบ</span></button></div>
      <button className="admin-sidebar-toggle" type="button" onClick={toggleSidebar} aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"} title={collapsed ? "ขยายเมนู" : "ย่อเมนู"}><ChevronLeft size={17}/></button>
    </aside>
    {mobileOpen && <button className="admin-sidebar-backdrop" type="button" aria-label="ปิดเมนู" onClick={() => setMobileOpen(false)}/>}
    <div className="admin-main"><header className="admin-topbar"><button className="admin-menu-toggle" type="button" onClick={() => setMobileOpen((v) => !v)} aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"}>{mobileOpen ? <X size={19}/> : <Menu size={19}/>}</button><div><span className="admin-topbar-kicker">{appName} / ADMIN</span><strong>ศูนย์จัดการระบบ</strong></div><span className="admin-status"><i/> ระบบจัดการ</span></header><main className="admin-content"><Outlet/></main></div>
    <nav className="admin-mobile-nav" aria-label="เมนูผู้ดูแล">{items.map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={Boolean(end)} className={({isActive})=>isActive?"active":""}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
  </div>;
}
