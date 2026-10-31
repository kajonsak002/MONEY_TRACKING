import { useEffect, useState } from "react";
import {
  FileJson,
  FileSpreadsheet,
  Moon,
  ShieldCheck,
  Sun,
  Tags,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { getEntriesInRange } from "../features/reports/reportApi";
import { getManagedCategories } from "../features/categories/categoriesApi";
import { CardGardenLedge, CardGinghamOverlay } from "../components/common/CardGrounding";

type Theme = "light" | "dark";

function downloadFile(content: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function today() {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const v = Object.fromEntries(p.map((x) => [x.type, x.value]));
  return `${v.year}-${v.month}-${v.day}`;
}

export function SettingsPage() {
  const { user, profile, signOut, configured } = useAuth();
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("money-theme") === "dark" ? "dark" : "light")
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function changeTheme(next: Theme) {
    setTheme(next);
    localStorage.setItem("money-theme", next);
  }

  async function exportData(format: "json" | "csv") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const entries = await getEntriesInRange("2000-01-01", today());
      if (format === "json") {
        const categories = await getManagedCategories();
        downloadFile(
          JSON.stringify({ exported_at: new Date().toISOString(), currency: "THB", entries, categories }, null, 2),
          "application/json;charset=utf-8",
          "money-tracking-backup.json"
        );
        setNotice("เตรียมไฟล์สำรอง JSON เรียบร้อยแล้ว");
      } else {
        const safeCell = (value: string | number) => {
          const text = String(value);
          return /^\s*[=+@-]/.test(text) ? "'" + text : text;
        };
        const rows = [
          ["date", "type", "amount_thb", "category", "note"],
          ...entries.map((entry) => {
            const category = Array.isArray(entry.categories) ? entry.categories[0] : entry.categories;
            return [safeCell(entry.occurred_on), safeCell(entry.type), (entry.amount_satang / 100).toFixed(2), safeCell(category?.name ?? ""), safeCell(entry.note ?? "")];
          }),
        ];
        const csv =
          "\uFEFF" +
          rows
            .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
            .join("\r\n");
        downloadFile(csv, "text/csv;charset=utf-8", "money-tracking-export.csv");
        setNotice("ส่งออกไฟล์ CSV เรียบร้อยแล้ว");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งออกข้อมูลไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "สมาชิก";
  const roleLabel = profile?.role === "admin" ? "ผู้ดูแลระบบ (Admin)" : "สมาชิก (Partner)";

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <header>
        <span className="text-[10px] font-bold tracking-widest text-[#438765] uppercase">
          Preferences
        </span>
        <h1 className="text-2xl font-bold text-[#22392f] mt-0.5">
          การตั้งค่า
        </h1>
        <p className="text-xs text-[#71877c]">
          จัดการข้อมูลส่วนตัว ธีมหน้าจอ และการสำรองข้อมูลของคุณ
        </p>
      </header>

      {/* ================= PROFILE CARD ================= */}
      <section className="relative bg-gradient-to-b from-[#fdf7f8] via-white to-[#faf2f4] rounded-3xl p-6 sm:p-7 border border-[#fad5dc] shadow-[0_8px_30px_rgba(42,78,56,0.04)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group transition-shadow hover:shadow-md overflow-visible">
        <CardGinghamOverlay opacity="opacity-[0.02]" />
        <CardGardenLedge className="right-6 w-24" />

        {/* Playful Pig Peeking Over Profile Card */}
        <div className="absolute -top-8 right-8 w-16 h-16 pointer-events-none filter drop-shadow-[0_8px_16px_rgba(40,75,50,0.14)] group-hover:scale-105 group-hover:-rotate-3 transition-all duration-300 z-20">
          <img
            src="/images/mascots/pig-mascot-happy.png"
            alt="Pig Assistant"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-full bg-[#ebf5ee] border border-[#c4e3cf] p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            <img
              src="/images/mascots/frog-mascot-happy.png"
              alt=""
              className="w-12 h-12 object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-base font-bold text-[#23382e]">{displayName}</strong>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#ebf5ee] text-[#2c5a42]">
                {roleLabel}
              </span>
            </div>
            <span className="block text-xs text-[#71877c] mt-0.5">{user?.email}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void signOut()}
          className="self-start sm:self-auto min-h-[44px] px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 transition"
        >
          ออกจากระบบ
        </button>
      </section>

      {/* ================= THEME SETTINGS ================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e2ece0] shadow-[0_8px_30px_rgba(42,78,56,0.04)] space-y-4">
        <h2 className="text-base font-bold text-[#23382e]">ธีมการแสดงผล</h2>
        <p className="text-xs text-[#71877c]">
          เลือกธีมสีหน้าจอที่สบายตาสำหรับคุณ
        </p>

        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => changeTheme("light")}
            className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all ${
              theme === "light"
                ? "border-[#438765] bg-[#ebf5ee] text-[#2c5a42] shadow-xs"
                : "border-[#dce7dc] bg-white text-[#71877c] hover:bg-[#f8faf7]"
            }`}
          >
            <Sun size={17} className={theme === "light" ? "text-amber-500" : ""} />
            <span>โหมดสว่าง (Light)</span>
          </button>

          <button
            type="button"
            onClick={() => changeTheme("dark")}
            className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-bold transition-all ${
              theme === "dark"
                ? "border-[#438765] bg-[#1a2b22] text-[#e8f5ec] shadow-xs"
                : "border-[#dce7dc] bg-white text-[#71877c] hover:bg-[#f8faf7]"
            }`}
          >
            <Moon size={17} className={theme === "dark" ? "text-indigo-400" : ""} />
            <span>โหมดมืด (Dark)</span>
          </button>
        </div>
      </section>

      {/* ================= SHORTCUT LINKS ================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e2ece0] shadow-[0_8px_30px_rgba(42,78,56,0.04)] space-y-3">
        <h2 className="text-base font-bold text-[#23382e]">เมนูจัดการ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/app/categories"
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#dce7dc] hover:border-[#438765] hover:bg-[#f8faf7] transition text-xs font-bold text-[#23382e]"
          >
            <Tags size={18} className="text-[#438765]" />
            <span>จัดการหมวดหมู่รายรับรายจ่าย</span>
          </Link>

          <Link
            to="/app/budget"
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#dce7dc] hover:border-[#438765] hover:bg-[#f8faf7] transition text-xs font-bold text-[#23382e]"
          >
            <Target size={18} className="text-[#438765]" />
            <span>ตั้งงบประมาณรายเดือน</span>
          </Link>

          {profile?.role === "admin" && (
            <Link
              to="/admin"
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#f3d2d7] bg-[#fdf0f2] hover:bg-[#fce6e9] transition text-xs font-bold text-[#b84a5a] sm:col-span-2"
            >
              <ShieldCheck size={18} className="text-[#b84a5a]" />
              <span>เข้าสู่ศูนย์จัดการระบบ (Admin Console)</span>
            </Link>
          )}
        </div>
      </section>

      {/* ================= BACKUP & EXPORT ================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e2ece0] shadow-[0_8px_30px_rgba(42,78,56,0.04)] space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#23382e]">สำรองและส่งออกข้อมูล</h2>
          <p className="text-xs text-[#71877c] mt-1">
            ดาวน์โหลดประวัติการเงินของคุณเก็บไว้เป็นไฟล์ JSON สำหรับสำรองข้อมูล หรือไฟล์ CSV สำหรับเปิดใน Excel หรือ Google Sheets
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy || !configured}
            onClick={() => void exportData("json")}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#dce7dc] bg-[#f8faf7] hover:bg-[#edf5ee] text-xs font-bold text-[#2c5840] flex items-center gap-2 transition disabled:opacity-50"
          >
            <FileJson size={16} />
            <span>สำรองข้อมูล JSON</span>
          </button>

          <button
            type="button"
            disabled={busy || !configured}
            onClick={() => void exportData("csv")}
            className="px-4 py-2.5 rounded-xl border border-[#dce7dc] bg-[#f8faf7] hover:bg-[#edf5ee] text-xs font-bold text-[#2c5840] flex items-center gap-2 transition disabled:opacity-50"
          >
            <FileSpreadsheet size={16} />
            <span>ส่งออกตาราง CSV</span>
          </button>
        </div>

        {!configured && <p className="text-xs text-[#bd4754]" role="status">ยังไม่ได้ตั้งค่า Supabase จึงยังส่งออกข้อมูลไม่ได้</p>}
        {busy && <p className="text-xs text-[#71877c]" role="status">กำลังเตรียมไฟล์ดาวน์โหลด...</p>}
        {notice && <p className="text-xs text-[#28764f] bg-[#eaf7ef] p-3 rounded-xl border border-[#cfe8d6]" role="status">{notice}</p>}
        {error && <p className="text-xs text-[#bd4754] bg-[#fff0f2] p-3 rounded-xl border border-[#fbdbe1]" role="alert">{error}</p>}
      </section>
    </div>
  );
}
