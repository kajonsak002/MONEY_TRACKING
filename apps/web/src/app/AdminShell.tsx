import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Activity, LayoutDashboard, LogOut, Settings, ShieldCheck, Users, Wallet } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

const items = [
  { to: "/admin", label: "ภาพรวมระบบ", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "ผู้ใช้งาน", icon: Users },
  { to: "/admin/transactions", label: "รายการทั้งหมด", icon: Wallet },
  { to: "/admin/activity", label: "กิจกรรมระบบ", icon: Activity },
  { to: "/admin/settings", label: "ตั้งค่าระบบ", icon: Settings },
];

export function AdminShell() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  if (profile?.role !== "admin") return <main className="admin-denied"><ShieldCheck size={32}/><h1>ไม่มีสิทธิ์เข้าถึง</h1><p>ส่วนนี้สำหรับผู้ดูแลระบบเท่านั้น</p><button onClick={() => navigate("/", { replace: true })}>กลับหน้าผู้ใช้งาน</button></main>;
  return <div className="admin-frame">
    <aside className="admin-sidebar">
      <a className="admin-brand" href="/admin"><span className="admin-brand-icon"><Wallet size={19}/></span><span>MONEY<span>TRACKING</span></span></a>
      <p className="admin-nav-caption">WORKSPACE</p>
      <nav className="admin-nav">{items.map(({to,label,icon:Icon,end}) => <NavLink key={to} to={to} end={end} className={({isActive})=>isActive?"admin-nav-link active":"admin-nav-link"}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <div className="admin-sidebar-bottom"><span className="admin-secure"><ShieldCheck size={15}/> Admin access</span><div className="admin-user"><span className="admin-avatar">{(profile.display_name || user?.email || "A").slice(0,1).toUpperCase()}</span><span><strong>{profile.display_name || "ผู้ดูแลระบบ"}</strong><small>{user?.email}</small></span></div><button className="admin-logout" onClick={() => void signOut()}><LogOut size={16}/> ออกจากระบบ</button></div>
    </aside>
    <div className="admin-main"><header className="admin-topbar"><div><span className="admin-topbar-kicker">MONEY TRACKING / ADMIN</span><strong>ศูนย์จัดการระบบ</strong></div><span className="admin-status"><i/> ระบบจัดการ</span></header><main className="admin-content"><Outlet/></main></div>
    <nav className="admin-mobile-nav" aria-label="เมนูผู้ดูแล">{items.slice(0,4).map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={end} className={({isActive})=>isActive?"active":""}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
  </div>;
}