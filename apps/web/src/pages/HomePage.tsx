import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  CircleAlert,
  Clock,
  LoaderCircle,
  Plus,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { parseEntryText, type AiEntryDraft } from "../features/entries/aiEntryApi";
import { createEntry, getCategories, getEntries } from "../features/entries/entriesApi";
import { getEntriesInRange, summarizeEntries } from "../features/reports/reportApi";
import { useNavigate } from "react-router-dom";
import {
  CardGinghamOverlay,
  HeroGround,
  HillScene,
} from "../components/common/CardGrounding";

function todayBangkok() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

function money(satang: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(satang / 100);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(`${value}T12:00:00+07:00`));
}

export function HomePage() {
  const { user, profile, configured } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const today = todayBangkok();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [quickText, setQuickText] = useState("");
  const [draft, setDraft] = useState<AiEntryDraft | null>(null);
  const [aiError, setAiError] = useState("");

  const categories = useQuery({ queryKey: ["categories"], queryFn: getCategories, enabled: configured });
  const recent = useQuery({ queryKey: ["entries"], queryFn: getEntries, enabled: configured });
  const report = useQuery({ queryKey: ["report", monthStart, today], queryFn: () => getEntriesInRange(monthStart, today), enabled: configured });
  const totals = useMemo(() => summarizeEntries(report.data ?? []), [report.data]);

  // Today stats
  const todayEntries = useMemo(() => (report.data ?? []).filter((e) => e.occurred_on === today), [report.data, today]);
  const todayIncome = useMemo(() => todayEntries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount_satang, 0), [todayEntries]);
  const todayExpense = useMemo(() => todayEntries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount_satang, 0), [todayEntries]);
  const todayIncomeCount = useMemo(() => todayEntries.filter((e) => e.type === "income").length, [todayEntries]);
  const todayExpenseCount = useMemo(() => todayEntries.filter((e) => e.type === "expense").length, [todayEntries]);

  // Month stats
  const monthIncomeCount = useMemo(() => (report.data ?? []).filter((e) => e.type === "income").length, [report.data]);
  const monthExpenseCount = useMemo(() => (report.data ?? []).filter((e) => e.type === "expense").length, [report.data]);

  const parseMutation = useMutation({
    mutationFn: parseEntryText,
    onSuccess: (value) => {
      setDraft(value);
      setAiError("");
    },
    onError: (error: Error) => setAiError(error.message),
  });

  const saveMutation = useMutation({
    mutationFn: async (value: AiEntryDraft) => {
      if (!value.type || !value.amount_thb || value.amount_thb <= 0) {
        throw new Error("AI ยังอ่านประเภทหรือจำนวนเงินไม่ครบ กรุณาแก้ไขก่อนบันทึก");
      }
      const category = (categories.data ?? []).find(
        (item) => item.name === value.category_name && item.type === value.type
      );
      await createEntry({
        type: value.type,
        amount_satang: Math.round(value.amount_thb * 100),
        note: value.note,
        occurred_on: value.occurred_on,
        category_id: category?.id ?? null,
      });
    },
    onSuccess: async () => {
      setDraft(null);
      setQuickText("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["entries"] }),
        qc.invalidateQueries({ queryKey: ["report"] }),
      ]);
    },
    onError: (error: Error) => setAiError(error.message),
  });

  const greetingName = profile?.display_name || user?.email?.split("@")[0] || "สมาชิก";

  function handleQuickSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickText.trim()) return;
    parseMutation.mutate(quickText.trim());
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* ================= HERO BALANCE BANNER ================= */}
      <section className="relative rounded-[32px] border border-[#c8e2cc] bg-gradient-to-br from-[#eaf6ed] via-[#f5fbf5] to-[#e6f5ea] shadow-[0_16px_48px_rgba(40,80,55,0.10)] overflow-hidden" style={{ minHeight: 260 }}>
        {/* Meadow photo background */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/images/illustrations/card-bg-meadow.png"
            alt=""
            className="w-full h-full object-cover object-bottom opacity-20 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#eaf6ed]/60 via-transparent to-[#b8e3c2]/40" />
          <CardGinghamOverlay opacity="opacity-[0.025]" />
        </div>

        {/* SVG scenic ground — mascots stand on this */}
        <HeroGround />

        {/* Desktop Pig — sits on the SVG ground (bottom-left) */}
        <div className="hidden md:flex absolute bottom-0 left-6 lg:left-14 items-end pointer-events-none z-10">
          <img
            src="/images/mascots/pig-mascot-happy.png"
            alt="Pig Mascot"
            className="w-28 h-28 lg:w-32 lg:h-32 object-contain drop-shadow-[0_10px_20px_rgba(30,65,40,0.20)] transition-transform duration-300 hover:scale-105"
          />
        </div>

        {/* Desktop Frog — sits on right side of SVG ground */}
        <div className="hidden md:flex absolute bottom-0 right-8 lg:right-16 items-end pointer-events-none z-10">
          <img
            src="/images/mascots/frog-mascot-happy.png"
            alt="Frog Mascot"
            className="w-24 h-24 lg:w-28 lg:h-28 object-contain drop-shadow-[0_10px_20px_rgba(30,65,40,0.18)] transition-transform duration-300 hover:scale-105 hover:-translate-y-1"
          />
        </div>

        {/* Mobile Pig — bottom right, sits on ground */}
        <div className="md:hidden absolute bottom-0 right-3 flex items-end pointer-events-none z-10">
          <img
            src="/images/mascots/pig-mascot-happy.png"
            alt="Pig Mascot"
            className="w-20 h-20 object-contain drop-shadow-md"
          />
        </div>

        {/* Content — centered, enough bottom padding to clear the ground + mascots */}
        <div className="relative z-10 px-6 pt-7 pb-32 sm:px-10 sm:pt-9 sm:pb-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#cde4d2] text-xs font-semibold text-[#3d6450] mb-3 shadow-sm backdrop-blur-sm">
            <Wallet size={13} className="text-[#3b805c]" />
            <span>ยอดคงเหลือทั้งหมด</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3429] mb-1">
            สวัสดี, {greetingName} 👋
          </h1>

          <div className="text-[clamp(36px,6vw,52px)] font-extrabold tracking-tight text-[#183024] tabular-nums leading-none my-2">
            {report.isLoading ? "กำลังคำนวณ..." : report.isError ? "โหลดข้อมูลไม่สำเร็จ" : money(totals.balance)}
          </div>

          <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#c6e0cc] text-xs font-semibold text-[#2e8a59] shadow-xs">
            <TrendingUp size={12} />
            <span>{totals.income >= totals.expense ? "+ 2.5% สภาพคล่องดีเยี่ยม" : "รายจ่ายมากกว่ารายรับเดือนนี้"}</span>
          </div>

          {/* Quick stats bar */}
          <div className="mt-5 w-full max-w-xs grid grid-cols-2 gap-2.5 pt-4 border-t border-[#c5dbc9]/60">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs py-2 px-3 rounded-2xl border border-white/70 shadow-xs">
              <span className="w-7 h-7 rounded-xl bg-[#e2f6eb] text-[#239667] flex items-center justify-center shrink-0">
                <ArrowDownLeft size={14} strokeWidth={2.5} />
              </span>
              <div className="text-left min-w-0">
                <span className="block text-[10px] text-[#71877c] leading-tight">รับเดือนนี้</span>
                <strong className="block text-xs font-bold text-[#239667] tabular-nums truncate">{money(totals.income)}</strong>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs py-2 px-3 rounded-2xl border border-white/70 shadow-xs">
              <span className="w-7 h-7 rounded-xl bg-[#ffeef0] text-[#dd5e6d] flex items-center justify-center shrink-0">
                <ArrowUpRight size={14} strokeWidth={2.5} />
              </span>
              <div className="text-left min-w-0">
                <span className="block text-[10px] text-[#71877c] leading-tight">จ่ายเดือนนี้</span>
                <strong className="block text-xs font-bold text-[#dd5e6d] tabular-nums truncate">{money(totals.expense)}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {report.isError && <p className="rounded-xl border border-[#fbdbe1] bg-[#fff0f2] p-3 text-xs text-[#bd4754]" role="alert">โหลดสรุปการเงินไม่สำเร็จ: {report.error.message}</p>}

      {/* ================= 4 STAT CARDS ================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: รายรับวันนี้ (Emerald) */}
        <article className="relative rounded-3xl overflow-hidden border border-[#cce7d3] shadow-[0_6px_20px_rgba(42,78,56,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group bg-gradient-to-b from-[#f0faf3] to-[#e4f5e9]" style={{ minHeight: 154 }}>
          <CardGinghamOverlay opacity="opacity-[0.025]" />
          <HillScene color="emerald" />
          {/* Mascot grounded on the hill */}
          <div className="absolute bottom-2 right-2 w-14 h-14 pointer-events-none z-10 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
            <img src="/images/mascots/pig-mascot-coin.png" alt="" className="w-full h-full object-contain drop-shadow-[0_6px_10px_rgba(25,70,40,0.18)]" />
          </div>
          {/* Content with padding to prevent collision with mascot */}
          <div className="relative z-10 p-4 sm:p-5 pr-14">
            <div className="flex items-center justify-between mb-2.5">
              <span className="w-8 h-8 rounded-full bg-white/85 text-[#229667] flex items-center justify-center shadow-xs border border-[#cae6d2]">
                <ArrowDownLeft size={16} strokeWidth={2.5} />
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 border border-[#d2ead7] text-[#4f7860]">วันนี้</span>
            </div>
            <p className="text-xs font-semibold text-[#62806e]">รายรับวันนี้</p>
            <strong className="block text-base sm:text-lg font-extrabold text-[#239667] tabular-nums mt-1 truncate">{money(todayIncome)}</strong>
            <span className="block text-[11px] text-[#7d9b87] mt-0.5">{todayIncomeCount} รายการ</span>
          </div>
        </article>

        {/* Card 2: รายจ่ายวันนี้ (Rose) */}
        <article className="relative rounded-3xl overflow-hidden border border-[#fbdae0] shadow-[0_6px_20px_rgba(42,78,56,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group bg-gradient-to-b from-[#fff5f6] to-[#fde8ec]" style={{ minHeight: 154 }}>
          <CardGinghamOverlay opacity="opacity-[0.025]" />
          <HillScene color="rose" />
          <div className="absolute bottom-2 right-2 w-14 h-14 pointer-events-none z-10 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
            <img src="/images/mascots/frog-mascot-happy.png" alt="" className="w-full h-full object-contain drop-shadow-[0_6px_10px_rgba(100,30,50,0.15)]" />
          </div>
          <div className="relative z-10 p-4 sm:p-5 pr-14">
            <div className="flex items-center justify-between mb-2.5">
              <span className="w-8 h-8 rounded-full bg-white/85 text-[#dd5e6d] flex items-center justify-center shadow-xs border border-[#fbdae0]">
                <ArrowUpRight size={16} strokeWidth={2.5} />
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 border border-[#fbdbe0] text-[#a4535e]">วันนี้</span>
            </div>
            <p className="text-xs font-semibold text-[#8b656b]">รายจ่ายวันนี้</p>
            <strong className="block text-base sm:text-lg font-extrabold text-[#dd5e6d] tabular-nums mt-1 truncate">{money(todayExpense)}</strong>
            <span className="block text-[11px] text-[#9f7980] mt-0.5">{todayExpenseCount} รายการ</span>
          </div>
        </article>

        {/* Card 3: รายรับเดือนนี้ (Lavender) */}
        <article className="relative rounded-3xl overflow-hidden border border-[#e4dcfb] shadow-[0_6px_20px_rgba(42,78,56,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group bg-gradient-to-b from-[#f8f4ff] to-[#ede6ff]" style={{ minHeight: 154 }}>
          <CardGinghamOverlay opacity="opacity-[0.025]" />
          <HillScene color="lavender" />
          <div className="absolute bottom-2 right-2 w-14 h-14 pointer-events-none z-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
            <img src="/images/mascots/pig-mascot-coin.png" alt="" className="w-full h-full object-contain drop-shadow-[0_6px_10px_rgba(60,40,90,0.18)]" />
          </div>
          <div className="relative z-10 p-4 sm:p-5 pr-14">
            <div className="flex items-center justify-between mb-2.5">
              <span className="w-8 h-8 rounded-full bg-white/85 text-[#785ad6] flex items-center justify-center shadow-xs border border-[#e4dcfb]">
                <Wallet size={16} strokeWidth={2} />
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 border border-[#ded5f8] text-[#6953aa]">เดือนนี้</span>
            </div>
            <p className="text-xs font-semibold text-[#736a88]">รายรับเดือนนี้</p>
            <strong className="block text-base sm:text-lg font-extrabold text-[#785ad6] tabular-nums mt-1 truncate">{money(totals.income)}</strong>
            <span className="block text-[11px] text-[#8e85a5] mt-0.5">{monthIncomeCount} รายการ</span>
          </div>
        </article>

        {/* Card 4: รายจ่ายเดือนนี้ (Amber) */}
        <article className="relative rounded-3xl overflow-hidden border border-[#fde5ce] shadow-[0_6px_20px_rgba(42,78,56,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group bg-gradient-to-b from-[#fffaf2] to-[#fdefd8]" style={{ minHeight: 154 }}>
          <CardGinghamOverlay opacity="opacity-[0.025]" />
          <HillScene color="amber" />
          <div className="absolute bottom-2 right-2 w-14 h-14 pointer-events-none z-10 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
            <img src="/images/mascots/frog-mascot-happy.png" alt="" className="w-full h-full object-contain drop-shadow-[0_6px_10px_rgba(100,60,20,0.15)]" />
          </div>
          <div className="relative z-10 p-4 sm:p-5 pr-14">
            <div className="flex items-center justify-between mb-2.5">
              <span className="w-8 h-8 rounded-full bg-white/85 text-[#cf7822] flex items-center justify-center shadow-xs border border-[#fde5ce]">
                <Clock size={16} strokeWidth={2} />
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 border border-[#fddbb8] text-[#9b6127]">เดือนนี้</span>
            </div>
            <p className="text-xs font-semibold text-[#8b755e]">รายจ่ายเดือนนี้</p>
            <strong className="block text-base sm:text-lg font-extrabold text-[#dd5e6d] tabular-nums mt-1 truncate">{money(totals.expense)}</strong>
            <span className="block text-[11px] text-[#a48e78] mt-0.5">{monthExpenseCount} รายการ</span>
          </div>
        </article>
      </section>

      {/* ================= AI QUICK ADD & SUMMARY GRID ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 pt-4">
        {/* Left Column: AI Quick Add */}
        <div className="relative bg-gradient-to-b from-[#f7fcf8] via-white to-[#f0f8f2] rounded-3xl p-6 sm:p-7 border border-[#cde5d3] shadow-[0_8px_28px_rgba(42,78,56,0.06)] group transition-shadow hover:shadow-md overflow-hidden">
          <CardGinghamOverlay opacity="opacity-[0.02]" />
          <HillScene color="sage" className="opacity-40" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-[#e5f5eb] text-[#2d5d44] flex items-center justify-center shadow-xs border border-[#cfe8d7]">
                  <Sparkles size={17} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-[#23382e]">บันทึกรายการง่าย ๆ</h2>
                  <p className="text-[11px] text-[#71877c]">พิมพ์ภาษาไทยได้ทันที เช่น "ข้าวกะเพรา 60" หรือ "เติมน้ำมัน 800 บาท"</p>
                </div>
              </div>

              {/* Cute Mascot with Speech Bubble in Header */}
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#2f6847] bg-[#e6f6eb] border border-[#c6e6d0] px-3 py-1 rounded-full shadow-2xs">
                  <span>เค้าช่วยจำได้นะ! 💬</span>
                </span>
                <div className="w-11 h-11 shrink-0 filter drop-shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                  <img src="/images/mascots/frog-mascot-happy.png" alt="Frog" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-3 mt-4">
              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={quickText}
                  onChange={(e) => setQuickText(e.target.value)}
                  placeholder="เช่น กาแฟอเมซอน 65 บาท, ค่าไฟ 1,200..."
                  className="flex-1 min-h-[48px] px-4 rounded-2xl border border-[#d2e4d4] bg-white text-xs text-[#22392f] placeholder-[#9fb3a6] focus:border-[#438765] focus:outline-none transition shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={parseMutation.isPending || !quickText.trim()}
                  className="px-5 min-h-[48px] rounded-2xl bg-[#234835] hover:bg-[#1b3a2a] text-white text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 shrink-0 shadow-sm active:scale-95"
                >
                  {parseMutation.isPending ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={15} />
                  )}
                  <span>อ่านข้อมูล</span>
                </button>
              </div>
            </form>
          </div>

          {aiError && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#bd4754] bg-[#fff0f2] p-3 rounded-xl border border-[#fbdbe1]">
              <CircleAlert size={15} className="shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* AI Parsed Draft Confirmation Card */}
          {draft && (
            <div className="mt-4 p-4 rounded-2xl bg-[#f2f8f3] border border-[#cbe3d2] animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2d5d44] flex items-center gap-1.5">
                  <Sparkles size={14} /> ผลการอ่านข้อมูล
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    draft.type === "income" ? "bg-[#e6f7ef] text-[#239667]" : "bg-[#fff0f2] text-[#dd5e6d]"
                  }`}
                >
                  {draft.type === "income" ? "รายรับ" : "รายจ่าย"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="block text-[10px] text-[#71877c]">จำนวนเงิน</span>
                  <strong className="text-sm font-bold text-[#23382e]">฿{draft.amount_thb?.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-[#71877c]">หมวดหมู่</span>
                  <strong className="text-xs font-semibold text-[#23382e]">{draft.category_name || "ทั่วไป"}</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-[#71877c]">วันที่</span>
                  <strong className="text-xs font-semibold text-[#23382e]">{formatShortDate(draft.occurred_on)}</strong>
                </div>
              </div>

              {draft.note && (
                <div className="text-xs text-[#526a5c]">
                  <span className="text-[10px] text-[#71877c]">โน้ต: </span>
                  {draft.note}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d8eadc]">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#667e71] hover:bg-[#e4ede5] transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate(draft)}
                  className="px-4 py-1.5 rounded-xl bg-[#234835] hover:bg-[#1a3828] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                >
                  {saveMutation.isPending ? <LoaderCircle size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>ยืนยันบันทึก</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Expense Proportion & Quick Actions */}
        <div className="relative bg-gradient-to-b from-[#fdfcf7] via-white to-[#faf9f4] rounded-3xl p-6 sm:p-7 border border-[#e5ebe0] shadow-[0_8px_28px_rgba(42,78,56,0.04)] flex flex-col justify-between overflow-hidden">
          <CardGinghamOverlay opacity="opacity-[0.015]" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#23382e]">สัดส่วนการเงิน</h2>
              <span className="text-[10px] font-bold tracking-wider text-[#d18428] uppercase bg-white/90 border border-[#fddbb8] px-2.5 py-1 rounded-full shadow-2xs">
                This Month
              </span>
            </div>
            <p className="text-xs text-[#71877c] mb-5">
              เปรียบเทียบการใช้จ่ายเทียบกับรายรับที่เข้ามา
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#6d8577]">สัดส่วนรายจ่าย</span>
                  <strong className="text-[#23382e] font-bold">
                    {totals.income > 0 ? Math.round((totals.expense / totals.income) * 100) : 0}% ของรายรับ
                  </strong>
                </div>
                <div className="h-3 w-full bg-[#edf4ec] rounded-full overflow-hidden p-0.5 border border-[#e2ece0]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#e89fa7] to-[#dd5e6d] transition-all duration-500 shadow-xs"
                    style={{
                      width: `${Math.min(100, totals.income > 0 ? (totals.expense / totals.income) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white/80 border border-[#e5ece2] shadow-2xs">
                  <span className="block text-[10px] text-[#71877c]">รายการทั้งหมด</span>
                  <strong className="text-base font-bold text-[#23382e] tabular-nums">{totals.count} รายการ</strong>
                </div>
                <div className="p-3 rounded-2xl bg-white/80 border border-[#e5ece2] shadow-2xs">
                  <span className="block text-[10px] text-[#71877c]">งบประมาณคงเหลือ</span>
                  <strong className="text-base font-bold text-[#239667] tabular-nums">
                    {totals.income >= totals.expense ? money(totals.balance) : "฿0.00"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/app/summary")}
            className="relative z-10 mt-6 w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-[#ebf5ee] hover:bg-[#deede2] text-xs font-bold text-[#2c5840] transition shadow-xs active:scale-[0.98]"
          >
            <span>ดูรายงานสรุปละเอียด</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {categories.isError && <p className="rounded-xl border border-[#fbdbe1] bg-[#fff0f2] p-3 text-xs text-[#bd4754]" role="alert">โหลดหมวดหมู่ไม่สำเร็จ: {categories.error.message}</p>}

      {/* ================= RECENT TRANSACTIONS ================= */}
      <section className="relative bg-gradient-to-b from-[#fbfdfb] via-white to-[#f7faf8] rounded-3xl p-6 sm:p-7 border border-[#dce8db] shadow-[0_8px_28px_rgba(42,78,56,0.04)] overflow-hidden">
        <CardGinghamOverlay opacity="opacity-[0.015]" />
        <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-[#23382e]">รายการล่าสุด</h2>
            <p className="text-xs text-[#71877c]">ประวัติรายรับและรายจ่ายที่บันทึกล่าสุด</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/app/entries")}
            className="text-xs font-semibold text-[#3b7e5b] hover:text-[#234835] flex items-center gap-1 transition"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight size={15} />
          </button>
        </div>

        {recent.isLoading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-xs text-[#71877c]" role="status"><LoaderCircle size={18} className="animate-spin"/>กำลังโหลดรายการล่าสุด...</div>
        ) : recent.isError ? (
          <p className="rounded-xl bg-[#fff0f2] border border-[#fbdbe1] p-4 text-xs text-[#bd4754]" role="alert">โหลดรายการล่าสุดไม่สำเร็จ: {recent.error.message}</p>
        ) : (recent.data ?? []).length === 0 ? (
          /* Empty State featuring newly generated empty-transactions.png */
          <div className="py-10 flex flex-col items-center justify-center text-center">
            <div className="w-36 h-36 mb-3">
              <img
                src="/images/empty-states/empty-transactions.png"
                alt="No transactions"
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            </div>
            <strong className="text-sm font-bold text-[#23382e]">ยังไม่มีรายการ</strong>
            <p className="text-xs text-[#71877c] max-w-sm mt-1">
              เริ่มบันทึกรายรับหรือรายจ่ายรายการแรกผ่านช่อง AI ด้านบน หรือกดปุ่มเพิ่มรายการได้เลยนะ 🌿
            </p>
            <button
              type="button"
              onClick={() => navigate("/app/entries")}
              className="mt-4 px-4 py-2 rounded-xl bg-[#234835] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-[#1a3828] transition"
            >
              <Plus size={14} />
              <span>เพิ่มรายการใหม่</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#edf3eb]">
            {(recent.data ?? []).slice(0, 7).map((entry) => {
              const category = Array.isArray(entry.categories) ? entry.categories[0] : entry.categories;
              const isIncome = entry.type === "income";

              return (
                <div key={entry.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isIncome ? "bg-[#e6f7ef] text-[#239667]" : "bg-[#fff0f2] text-[#dd5e6d]"
                      }`}
                    >
                      {isIncome ? <ArrowDownLeft size={18} strokeWidth={2.5} /> : <ArrowUpRight size={18} strokeWidth={2.5} />}
                    </span>
                    <div className="min-w-0">
                      <strong className="block truncate text-xs font-bold text-[#23382e]">
                        {entry.note || category?.name || (isIncome ? "รายรับ" : "รายจ่าย")}
                      </strong>
                      <span className="block text-[11px] text-[#789083]">
                        {category?.name ? `${category.name} · ` : ""}
                        {formatShortDate(entry.occurred_on)}
                      </span>
                    </div>
                  </div>

                  <strong
                    className={`text-sm font-bold tabular-nums whitespace-nowrap ${
                      isIncome ? "text-[#239667]" : "text-[#dd5e6d]"
                    }`}
                  >
                    {isIncome ? "+" : "−"}
                    {money(entry.amount_satang)}
                  </strong>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
