import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { ChartNoAxesCombined, House, LogOut, Plus, Settings, Wallet } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";

const navigation = [
  { to: "/app", label: "หน้าหลัก", icon: House },
  { to: "/app/entries", label: "รายการ", icon: Wallet },
  { to: "/app/summary", label: "รายงาน", icon: ChartNoAxesCombined },
  { to: "/app/settings", label: "ตั้งค่า", icon: Settings },
];

export function AppShell() {
  const { profile, user, signOut } = useAuth();
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "สมาชิก";
  const [appName, setAppName] = useState("Money");
  const [appTagline, setAppTagline] = useState("Mate");

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const load = async () => {
      const { data } = await client.from("app_settings").select("key,value").in("key", ["app_name", "app_tagline"]);
      for (const row of data ?? []) {
        if (row.key === "app_name" && typeof row.value === "string") setAppName(row.value);
        if (row.key === "app_tagline" && typeof row.value === "string") setAppTagline(row.value);
      }
    };
    void load();
    window.addEventListener("app-settings-updated", load);
    return () => window.removeEventListener("app-settings-updated", load);
  }, []);

  if (profile?.role === "admin") return <Navigate to="/admin" replace />;

  return <div className="app-frame member-app-frame">
    <header className="topbar member-topbar">
      <a className="brand-mark" href="/app" aria-label={`${appName} ${appTagline} หน้าแรก`}>
        <span className="brand-icon mascot-brand"><img src="/assets/mascot-pig.svg" alt="" /></span>
        <span>{appName}<span className="brand-accent">{appTagline}</span></span>
      </a>
      <div className="account-menu">
        <div className="account-copy"><strong>{displayName}</strong><small>บัญชีของฉัน</small></div>
        <button className="signout-button" type="button" onClick={() => void signOut()} aria-label="ออกจากระบบ" title="ออกจากระบบ"><LogOut size={17}/></button>
      </div>
    </header>
    <main className="page-content member-page-content"><Outlet/></main>
    <nav className="bottom-nav member-bottom-nav" aria-label="เมนูหลัก">
      {navigation.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} end={to === "/app"} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
        <Icon size={20} strokeWidth={1.9}/><span>{label}</span>
      </NavLink>)}
      <NavLink to="/app/entries" state={{quickAdd:true}} className="member-add-shortcut" aria-label="เพิ่มรายการ"><Plus size={23}/></NavLink>
    </nav>
  </div>;
}