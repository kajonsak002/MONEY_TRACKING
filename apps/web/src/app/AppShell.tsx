import { NavLink, Outlet } from "react-router-dom";
import { ChartNoAxesCombined, House, Settings, Wallet } from "lucide-react";

const navigation = [
  { to: "/", label: "ภาพรวม", icon: House },
  { to: "/entries", label: "รายการ", icon: Wallet },
  { to: "/summary", label: "สรุป", icon: ChartNoAxesCombined },
  { to: "/settings", label: "ตั้งค่า", icon: Settings },
];

export function AppShell() {
  return (
    <div className="app-frame">
      <header className="topbar">
        <a className="brand-mark" href="/" aria-label="Money Tracking หน้าแรก">
          <span className="brand-icon"><Wallet size={19} /></span>
          <span>money<span className="brand-accent">mate</span></span>
        </a>
        <span className="topbar-caption">จัดการเงินให้ง่ายขึ้น</span>
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