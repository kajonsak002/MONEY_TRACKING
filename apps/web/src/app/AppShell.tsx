import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { ChartNoAxesCombined, House, LogOut, Settings, Wallet } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";

const navigation = [
  { to: "/app", label: "ภาพรวม", icon: House },
  { to: "/app/entries", label: "รายการ", icon: Wallet },
  { to: "/app/summary", label: "สรุป", icon: ChartNoAxesCombined },
  { to: "/app/settings", label: "ตั้งค่า", icon: Settings },
];
export function AppShell() {
  const { profile, user, signOut } = useAuth();
  if (profile?.role === "admin") return <Navigate to="/admin" replace />;
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "สมาชิก";
  const roleLabel = "สมาชิก";
  const [appName, setAppName] = useState("money");
  const [appTagline, setAppTagline] = useState("mate");
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
  return <div className="app-frame"><header className="topbar">
    <a className="brand-mark" href="/app" aria-label="Money Tracking หน้าแรก"><span className="brand-icon"><Wallet size={19}/></span><span>{appName}<span className="brand-accent">{appTagline}</span></span></a>
    <div className="account-menu"><div className="account-copy"><strong>{displayName}</strong><small>{roleLabel}</small></div><button className="signout-button" type="button" onClick={() => void signOut()} aria-label="ออกจากระบบ" title="ออกจากระบบ"><LogOut size={17}/></button></div>
  </header><main className="page-content"><Outlet/></main><nav className="bottom-nav" aria-label="เมนูหลัก">
    {navigation.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} end={to === "/app"} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><Icon size={19} strokeWidth={1.8}/><span>{label}</span></NavLink>)}
  </nav></div>;
}