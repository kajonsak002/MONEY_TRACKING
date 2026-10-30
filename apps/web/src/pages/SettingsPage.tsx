import { useEffect, useState } from "react";
import { Moon, Sun, FileJson, FileSpreadsheet, Tags, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { getEntriesInRange } from "../features/reports/reportApi";
import { getManagedCategories } from "../features/categories/categoriesApi";

type Theme = "light" | "dark";
function downloadFile(content: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click();
  URL.revokeObjectURL(url);
}
function today() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const v = Object.fromEntries(p.map((x) => [x.type, x.value]));
  return `${v.year}-${v.month}-${v.day}`;
}
export function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem("money-theme") === "dark" ? "dark" : "light");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  function changeTheme(next: Theme) { setTheme(next); localStorage.setItem("money-theme", next); }
  async function exportData(format: "json" | "csv") {
    setBusy(true); setError("");
    try {
      const entries = await getEntriesInRange("2000-01-01", today());
      if (format === "json") {
        const categories = await getManagedCategories();
        downloadFile(JSON.stringify({ exported_at: new Date().toISOString(), currency: "THB", entries, categories }, null, 2), "application/json;charset=utf-8", "money-tracking-backup.json");
      } else {
        const rows = [["date","type","amount_thb","category","note"], ...entries.map((entry) => {
          const category = Array.isArray(entry.categories) ? entry.categories[0] : entry.categories;
          return [entry.occurred_on, entry.type, (entry.amount_satang / 100).toFixed(2), category?.name ?? "", entry.note ?? ""];
        })];
        const csv = "\uFEFF" + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
        downloadFile(csv, "text/csv;charset=utf-8", "money-tracking-export.csv");
      }
    } catch (e) { setError(e instanceof Error ? e.message : "ส่งออกข้อมูลไม่สำเร็จ"); }
    finally { setBusy(false); }
  }
  return <div className="settings-page"><header className="page-title-row"><div><p className="eyebrow">PREFERENCES</p><h1>ตั้งค่า</h1><p className="muted">จัดการบัญชี รูปแบบ และข้อมูลของคุณ</p></div></header>
    <section className="settings-card"><h2>บัญชีผู้ใช้</h2><div className="settings-account"><strong>{profile?.display_name || "สมาชิก"}</strong><span>{user?.email}</span><small>{profile?.role === "admin" ? "ผู้ดูแลระบบ" : "สมาชิก"}</small></div><button className="settings-danger" type="button" onClick={() => void signOut()}>ออกจากระบบ</button></section>
    <section className="settings-card"><h2>ปรับแต่งแอป</h2><div className="theme-options"><button type="button" className={theme === "light" ? "chosen" : ""} onClick={() => changeTheme("light")}><Sun size={18}/> สว่าง</button><button type="button" className={theme === "dark" ? "chosen" : ""} onClick={() => changeTheme("dark")}><Moon size={18}/> มืด</button></div>
      <Link className="settings-link" to="/categories"><Tags size={17}/> จัดการหมวดหมู่</Link>
      {profile?.role === "admin" && <Link className="settings-link" to="/admin"><ShieldCheck size={17}/> จัดการระบบ (Admin)</Link>}
    </section>
    <section className="settings-card"><h2>สำรองและส่งออกข้อมูล</h2><p className="muted">ดาวน์โหลดข้อมูลรายการของคุณเก็บไว้ในอุปกรณ์ ควรเก็บไฟล์สำรองในที่ปลอดภัย</p><div className="export-actions"><button type="button" disabled={busy} onClick={() => void exportData("json")}><FileJson size={17}/> สำรอง JSON</button><button type="button" disabled={busy} onClick={() => void exportData("csv")}><FileSpreadsheet size={17}/> ส่งออก CSV</button></div>{busy && <p className="muted">กำลังเตรียมไฟล์...</p>}{error && <p className="entry-error">{error}</p>}</section>
  </div>;
}
