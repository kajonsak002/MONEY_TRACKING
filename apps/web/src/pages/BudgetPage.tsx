import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Coins,
  LoaderCircle,
  Save,
  Target,
} from "lucide-react";
import { getMonthlyBudget, saveMonthlyBudget } from "../features/budget/budgetApi";
import { getEntriesInRange, summarizeEntries } from "../features/reports/reportApi";
import { CardGardenLedge, CardGinghamOverlay, CardMeadowFooter } from "../components/common/CardGrounding";

function monthInfo() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const start = `${values.year}-${values.month}-01`;
  const lastDay = new Date(Number(values.year), Number(values.month), 0).getDate();
  return {
    yearMonth: `${values.year}-${values.month}`,
    start,
    end: `${values.year}-${values.month}-${String(lastDay).padStart(2, "0")}`,
  };
}

const formatMoney = (satang: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(satang / 100);

export function BudgetPage() {
  const qc = useQueryClient();
  const month = monthInfo();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const budget = useQuery({
    queryKey: ["budget", month.start],
    queryFn: () => getMonthlyBudget(month.start),
  });

  const entries = useQuery({
    queryKey: ["report", month.start, month.end],
    queryFn: () => getEntriesInRange(month.start, month.end),
  });

  const summary = summarizeEntries(entries.data ?? []);
  const spent = summary.expense;
  const limit = budget.data?.limit_satang ?? 0;
  const percent = limit ? Math.min(100, (spent / limit) * 100) : 0;
  const isOver = limit > 0 && spent > limit;

  const save = useMutation({
    mutationFn: (value: number) => saveMonthlyBudget(month.start, value),
    onSuccess: async () => {
      setAmount("");
      setError("");
      await qc.invalidateQueries({ queryKey: ["budget", month.start] });
    },
    onError: (e: Error) => setError(e.message),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || !/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      setError("กรุณากรอกงบประมาณที่มากกว่า 0 และไม่เกิน 2 ตำแหน่งทศนิยม");
      return;
    }
    save.mutate(Math.round(value * 100));
  }

  const presets = [5000, 10000, 15000, 20000, 30000];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#438765] uppercase">
            Monthly Target
          </span>
          <h1 className="text-2xl font-bold text-[#22392f] mt-0.5">
            งบประมาณรายเดือน
          </h1>
          <p className="text-xs text-[#71877c]">
            กำหนดเพดานค่าใช้จ่ายเพื่อการออมเงินที่มีประสิทธิภาพ 🌿
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-[#e2ede0] text-[#4d6e5c] shadow-2xs self-start sm:self-auto">
          รอบเดือน {month.yearMonth}
        </span>
      </header>

      {/* ================= HERO OVERVIEW CARD ================= */}
      <section className="relative bg-gradient-to-b from-[#f8fcf9] via-white to-[#f3faf5] rounded-3xl p-6 sm:p-8 border border-[#d2ead6] shadow-[0_8px_30px_rgba(42,78,56,0.05)] grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6 items-center overflow-hidden">
        <CardGinghamOverlay opacity="opacity-[0.02]" />

        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-[#d2ead6] text-xs font-bold text-[#2d5d44] shadow-2xs">
            <Target size={14} />
            <span>สถานะการใช้จ่ายเดือนนี้</span>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[#71877c]">ใช้จ่ายไปแล้ว</span>
            <strong className="block text-3xl sm:text-4xl font-extrabold text-[#23382e] tabular-nums mt-0.5">
              {formatMoney(spent)}
            </strong>
            <span className="block text-xs text-[#71877c] mt-1">
              {limit > 0 ? `จากงบประมาณที่ตั้งไว้ ${formatMoney(limit)}` : "ยังไม่ได้กำหนดงบประมาณสำหรับเดือนนี้"}
            </span>
          </div>

          {/* Progress Track */}
          {limit > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={isOver ? "text-[#dd5e6d]" : "text-[#239667]"}>
                  {Math.round(percent)}% ของงบประมาณ
                </span>
                <span className="text-[#71877c]">
                  {isOver ? `เกินงบ ${formatMoney(spent - limit)}` : `เหลืองบ ${formatMoney(limit - spent)}`}
                </span>
              </div>
              <div className="h-3.5 w-full bg-[#edf4ec] rounded-full overflow-hidden p-0.5 border border-[#dbe8dc]">
                <div
                  className={`h-full rounded-full transition-all duration-500 shadow-xs ${
                    isOver ? "bg-[#dd5e6d]" : percent > 80 ? "bg-[#e5a03d]" : "bg-[#239667]"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mascot Illustration Spotlight with Grassy Ground Base */}
        <div className="relative flex flex-col items-center justify-center p-5 rounded-2xl bg-white/80 border border-[#d9ecd9] text-center shadow-xs overflow-hidden z-10">
          <CardMeadowFooter className="opacity-60" />
          <div className="relative z-10 w-44 h-44 mb-1">
            <img
              src="/images/illustrations/mascot-saving-goal.png"
              alt="Saving Goal Mascot"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>
          <span className="relative z-10 text-xs font-bold text-[#2d5d44]">เก็บเล็กผสมน้อย เป็นเงินก้อนโต</span>
          <p className="relative z-10 text-[11px] text-[#71877c] mt-0.5">
            รักษาวินัยการใช้จ่ายทุกวันนะ 💚
          </p>
        </div>
      </section>

      {/* ================= BUDGET FORM ================= */}
      <section className="relative bg-gradient-to-b from-[#f5fbf7] via-white to-[#eef8f1] rounded-3xl p-6 sm:p-7 border border-[#cfead5] shadow-[0_8px_30px_rgba(42,78,56,0.04)] group transition-shadow hover:shadow-md overflow-visible">
        <CardGinghamOverlay opacity="opacity-[0.02]" />
        <CardGardenLedge className="right-6 w-24" />

        {/* Playful Frog Peeking Over Form Card */}
        <div className="absolute -top-8 right-8 w-16 h-16 pointer-events-none filter drop-shadow-[0_8px_16px_rgba(35,70,45,0.16)] group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 z-20">
          <img
            src="/images/mascots/frog-mascot-happy.png"
            alt="Frog Assistant"
            className="w-full h-full object-contain"
          />
        </div>
        {/* Speech Bubble Tag */}
        <span className="hidden sm:inline-flex absolute -top-8 right-26 items-center gap-1 px-3 py-1 rounded-full bg-white/95 border border-[#c4e3cb] text-[10px] font-bold text-[#286b46] shadow-xs backdrop-blur-xs z-20">
          วางแผนดี มีเงินเหลือเก็บ! 🌿
        </span>

        <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Coins size={18} className="text-[#438765]" />
          <h2 className="text-base font-bold text-[#23382e]">
            {limit ? "ปรับเปลี่ยนงบประมาณ" : "ตั้งค่างบประมาณใหม่"}
          </h2>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#506c5e] mb-1.5">
              งบรายจ่ายต่อเดือน (บาท) *
            </label>
            <div className="relative max-w-md">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8ba395]">
                ฿
              </span>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder={limit ? String(limit / 100) : "เช่น 15000"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full min-h-[46px] pl-8 pr-4 rounded-xl border border-[#dce7dc] bg-[#f8faf7] text-sm font-bold text-[#23382e] placeholder-[#a4b8ab] focus:border-[#438765] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="block text-[11px] text-[#71877c] mb-2 font-medium">ปุ่มลัดระบุจำนวน:</span>
            <div className="flex flex-wrap gap-2">
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String(val))}
                  className="px-3 py-1.5 rounded-xl bg-[#f4f8f3] hover:bg-[#eaf4ec] border border-[#dce7dc] text-xs font-semibold text-[#3b664e] transition"
                >
                  ฿{val.toLocaleString("th-TH")}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-[#bd4754] bg-[#fff0f2] p-3 rounded-xl border border-[#fbdbe1]" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="px-6 py-3 rounded-2xl bg-[#234835] hover:bg-[#1a3828] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {save.isPending ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>{save.isPending ? "กำลังบันทึก..." : "บันทึกงบประมาณ"}</span>
            </button>
          </div>
        </form>
        </div>
      </section>
    </div>
  );
}
