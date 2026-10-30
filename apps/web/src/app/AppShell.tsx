import { NavLink, Outlet } from "react-router-dom";
import { ChartNoAxesCombined, House, LogOut, Settings, Wallet } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

const navigation = [
  { to: "/", label: "ภาพรวม", icon: House },
  { to: "/entries", label: "รายการ", icon: Wallet },
  { to: "/summary", label: "สรุป", icon: ChartNoAxesCombined },
  { to: "/settings", label: "ตั้งค่า", icon: Settings },
];

export function AppShell() {
  const { profile, user, signOut } = useAuth();
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "สมาชิก";
  const roleLabel = profile?.role === "admin" ? "ผู้ดูแลระบบ" : "สมาชิก";

  return (
    <div className="app-frame">
      <header className="topbar">
        <a className="brand-mark" href="/" aria-label="Money Tracking หน้าแรก">
          <span className="brand-icon"><Wallet size={19} /></span>
          <span>money<span className="brand-accent">mate</span></span>
        </a>
        <div className="account-menu">
          <div className="account-copy"><strong>{displayName}</strong><small>{roleLabel}</small></div>
          <button className="signout-button" type="button" onClick={() => void signOut()} aria-label="ออกจากระบบ" title="ออกจากระบบ"><LogOut size={17} /></button>
        </div>
      </header>
      <main className="page-content"><Outlet /></main>
      <nav className="bottom-nav" aria-label="เมนูหลัก">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <Icon size={20} strokeWidth={1.8} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}