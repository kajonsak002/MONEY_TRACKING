import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronRight, CirclePlus, LoaderCircle, Sparkles, Wallet } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { parseEntryText, type AiEntryDraft } from "../features/entries/aiEntryApi";
import { createEntry, getCategories, getEntries, type EntryType } from "../features/entries/entriesApi";
import { getEntriesInRange, summarizeEntries } from "../features/reports/reportApi";
import { useNavigate } from "react-router-dom";

function todayBangkok() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}
function money(satang: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(satang / 100);
}
const card = "rounded-[26px] border border-[#e8eee6] bg-white shadow-[0_10px_32px_rgba(47,77,55,0.055)]";
const field = "w-full rounded-2xl border border-[#e3eae1] bg-[#fbfcfa] px-4 py-3 text-sm text-[#34483d] outline-none transition focus:border-[#79a88c] focus:ring-4 focus:ring-[#79a88c]/15";

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
  const parseMutation = useMutation({
    mutationFn: parseEntryText,
    onSuccess: (value) => { setDraft(value); setAiError(""); },
    onError: (error: Error) => setAiError(error.message),
  });
  const saveMutation = useMutation({
    mutationFn: async (value: AiEntryDraft) => {
      if (!value.type || !value.amount_thb || value.amount_thb <= 0) throw new Error("AI ยังอ่านประเภทหรือจำนวนเงินไม่ครบ กรุณาแก้ไขก่อนบันทึก");
      const category = (categories.data ?? []).find((item) => item.name === value.category_name && item.type === value.type);
      await createEntry({ type: value.type, amount_satang: Math.round(value.amount_thb * 100), note: value.note, occurred_on: value.occurred_on, category_id: category?.id ?? null });
    },
    onSuccess: async () => {
      setDraft(null); setQuickText("");
      await Promise.all([qc.invalidateQueries({ queryKey: ["entries"] }), qc.invalidateQueries({ queryKey: ["report"] })]);
    },
    onError: (error: Error) => setAiError(error.message),
  });
  const greetingName = profile?.display_name || user?.email?.split("@")[0] || "สมาชิก";
  const day = new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date());
  const categoryLabel = (categories.data ?? []).find((item) => item.name === draft?.category_name && item.type === draft?.type)?.name ?? "ไม่ระบุหมวดหมู่";
  function updateDraft<K extends keyof AiEntryDraft>(key: K, value: AiEntryDraft[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }

  return <div className="mx-auto grid w-full max-w-[1040px] gap-6 text-[#34483d] sm:gap-7">
    <section className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-[#7b9a83]"><CalendarDays size={14}/>{day}</div>
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.8px] text-[#293d32] sm:text-[32px]">สวัสดี, {greetingName}</h1>
        <p className="mt-1 text-sm text-[#839187]">มาดูแลการเงินของคุณให้ดีขึ้นกัน</p>
      </div>
      <div className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-[22px] bg-[#edf5e9] sm:h-[76px] sm:w-[76px]">
        <img src="/assets/mascot-frog.svg" alt="" className="h-[56px] w-[56px] object-contain sm:h-[68px] sm:w-[68px]"/>
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
      <div className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#e7f4e6] via-[#f1f5e9] to-[#fff0e9] p-5 shadow-[0_16px_38px_rgba(79,119,84,0.10)] sm:p-7">
        <div className="pointer-events-none absolute -right-3 -bottom-5 flex items-end opacity-90 sm:right-3">
          <img src="/assets/mascot-pig.svg" alt="" className="h-[118px] w-[118px] object-contain sm:h-[152px] sm:w-[152px]"/>
          <img src="/assets/mascot-frog.svg" alt="" className="-ml-7 h-[98px] w-[98px] object-contain sm:h-[126px] sm:w-[126px]"/>
        </div>
        <div className="relative z-10 max-w-[70%] sm:max-w-[72%]">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#698575]"><Wallet size={15}/> ยอดสุทธิเดือนนี้</div>
          <div className="mt-3 text-[clamp(28px,6vw,42px)] font-bold leading-tight tracking-[-1.3px] text-[#2f4d3c] tabular-nums">{report.isLoading ? "กำลังโหลด..." : report.isError ? "โหลดข้อมูลไม่สำเร็จ" : money(totals.balance)}</div>
          <span className="mt-2 inline-flex rounded-full border border-[#c8dcca] bg-white/55 px-3 py-1 text-[11px] text-[#6f8c78]">อัปเดตข้อมูลล่าสุด</span>
        </div>
        <div className="relative z-10 mt-7 grid max-w-[78%] grid-cols-2 gap-3 border-t border-[#bcd3bd]/70 pt-4 sm:mt-9">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/75 text-[#3c9b72]"><ArrowDownLeft size={18}/></span>
            <span className="min-w-0"><small className="block text-[11px] text-[#789080]">รายรับ</small><strong className="block truncate text-[13px] font-bold text-[#328765] tabular-nums">{money(totals.income)}</strong></span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/75 text-[#df7880]"><ArrowUpRight size={18}/></span>
            <span className="min-w-0"><small className="block text-[11px] text-[#789080]">รายจ่าย</small><strong className="block truncate text-[13px] font-bold text-[#d86c76] tabular-nums">{money(totals.expense)}</strong></span>
          </div>
        </div>
      </div>

      {report.isError && <p className="rounded-xl border border-[#f1c9cc] bg-[#fff0f1] p-3 text-xs text-[#b94f5a]" role="alert">โหลดสรุปการเงินไม่สำเร็จ: {(report.error as Error).message}</p>}\n      <div className={`${card} flex flex-col justify-between p-5 sm:p-6`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[1.3px] text-[#81a18a]"><span className="h-2 w-2 rounded-full bg-[#e9b968]"/> THIS MONTH</div>
          <h2 className="mt-2 text-lg font-bold text-[#34483d]">สรุปการใช้เงิน</h2>
          <p className="mt-1 text-xs text-[#8b988f]">ภาพรวมรายรับและรายจ่ายของคุณ</p>
        </div>
        <div className="mt-5 space-y-4">
          <div><div className="mb-2 flex justify-between text-xs"><span className="text-[#7d8b81]">สัดส่วนรายจ่าย</span><strong className="text-[#526b59]">{totals.income > 0 ? Math.round(totals.expense / totals.income * 100) : 0}% ของรายรับ</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-[#f0f3ee]"><div className="h-full rounded-full bg-[#e8a0a0] transition-all" style={{width:`${Math.min(100, totals.income > 0 ? totals.expense / totals.income * 100 : 0)}%`}}/></div></div>
          <button type="button" onClick={() => navigate("/app/summary")} className="flex w-full items-center justify-between rounded-2xl bg-[#f1f6ef] px-4 py-3 text-sm font-semibold text-[#5c8066] transition hover:bg-[#e8f1e5]">ดูรายงานการเงิน <ChevronRight size={17}/></button>
        </div>
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className={`${card} relative overflow-hidden p-5 sm:p-6`}>
        <img src="/assets/mascot-frog.svg" alt="" className="pointer-events-none absolute right-4 top-3 h-[62px] w-[62px] object-contain opacity-80"/>
        <div className="relative flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-bold tracking-[1.5px] text-[#86a38c]">AI QUICK ADD</p><h2 className="mt-1 text-lg font-bold text-[#34483d]">บันทึกรายการง่าย ๆ</h2><p className="mt-1 max-w-[340px] text-xs leading-5 text-[#89958c]">พิมพ์สิ่งที่คุณใช้จ่าย แล้วให้ AI ช่วยจัดหมวดหมู่ให้</p></div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff5df] text-[#d6a34e]"><Sparkles size={19}/></span>
        </div>
        <form className="mt-5 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (quickText.trim()) parseMutation.mutate(quickText.trim()); }}>
          <input className={field} id="quick-entry" value={quickText} onChange={(event) => {setQuickText(event.target.value);setDraft(null);}} maxLength={200} placeholder="เช่น กินข้าว 60 บาทเมื่อเที่ยง" disabled={!configured || parseMutation.isPending}/>
          <button className="grid h-[48px] w-[50px] shrink-0 place-items-center rounded-2xl bg-[#6f9b7a] text-white shadow-md shadow-[#6f9b7a]/20 transition hover:bg-[#5c8868] disabled:opacity-50" type="submit" disabled={!quickText.trim() || parseMutation.isPending} aria-label="วิเคราะห์รายการ">{parseMutation.isPending ? <LoaderCircle className="animate-spin" size={19}/> : <CirclePlus size={20}/>}</button>
        </form>
        <p className="mt-2 text-[11px] text-[#9aa49c]">ตรวจสอบข้อมูลก่อนบันทึกทุกครั้ง</p>
        {aiError && <p className="mt-3 rounded-xl bg-[#fff0f0] p-3 text-xs text-[#c65d68]" role="alert">{aiError}</p>}
        {draft && <div className="mt-4 space-y-3 rounded-2xl border border-[#e4ece2] bg-[#fafcf9] p-4">
          <strong className="text-sm">ตรวจสอบรายการก่อนบันทึก</strong>
          <label className="block text-xs text-[#77877b]">ประเภท<select className={`${field} mt-1`} value={draft.type ?? ""} onChange={(e) => updateDraft("type", (e.target.value || null) as EntryType | null)}><option value="">เลือกประเภท</option><option value="expense">รายจ่าย</option><option value="income">รายรับ</option></select></label>
          <div className="grid grid-cols-2 gap-3"><label className="block text-xs text-[#77877b]">จำนวนเงิน<input className={`${field} mt-1`} type="number" min="0.01" step="0.01" value={draft.amount_thb ?? ""} onChange={(e) => updateDraft("amount_thb", e.target.value ? Number(e.target.value) : null)}/></label><label className="block text-xs text-[#77877b]">วันที่<input className={`${field} mt-1`} type="date" value={draft.occurred_on} onChange={(e) => updateDraft("occurred_on", e.target.value)}/></label></div>
          <label className="block text-xs text-[#77877b]">บันทึก<input className={`${field} mt-1`} maxLength={500} value={draft.note} onChange={(e) => updateDraft("note", e.target.value)}/></label>
          <p className="text-xs text-[#829086]">หมวดหมู่ที่ AI แนะนำ: {categoryLabel} · ความมั่นใจ {Math.round(draft.confidence * 100)}%</p>
          <div className="flex gap-2"><button type="button" disabled={saveMutation.isPending || !draft.type || !draft.amount_thb} onClick={() => saveMutation.mutate(draft)} className="rounded-xl bg-[#6f9b7a] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{saveMutation.isPending ? "กำลังบันทึก..." : "ยืนยันและบันทึก"}</button><button type="button" onClick={() => setDraft(null)} className="rounded-xl bg-[#edf1ec] px-4 py-2.5 text-xs font-semibold text-[#68766c]">ยกเลิก</button></div>
        </div>}
      </div>

      <div className={`${card} p-5 sm:p-6`}>
        <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[1.5px] text-[#86a38c]">RECENT ACTIVITY</p><h2 className="mt-1 text-lg font-bold text-[#34483d]">รายการล่าสุด</h2></div><button type="button" onClick={() => navigate("/app/entries")} className="text-xs font-semibold text-[#6e9878] hover:text-[#456e50]">ดูทั้งหมด</button></div>
        {recent.isLoading ? <div className="flex items-center gap-2 py-8 text-sm text-[#8b988f]"><LoaderCircle className="animate-spin" size={17}/>กำลังโหลด...</div> : recent.isError ? <p className="rounded-xl bg-[#fff0f1] p-3 text-xs text-[#b94f5a]" role="alert">โหลดรายการล่าสุดไม่สำเร็จ: {(recent.error as Error).message}</p> : (recent.data ?? []).length === 0 ? <div className="flex flex-col items-center py-7 text-center"><img className="mb-2 h-[78px] w-[88px] object-contain" src="/assets/mascot-pig.svg" alt=""/><strong className="text-sm text-[#596d5e]">ยังไม่มีรายการ</strong><p className="mt-1 text-xs text-[#9aa49c]">เริ่มบันทึกรายรับรายจ่ายได้เลย</p></div> : <div className="divide-y divide-[#eff2ed]">{(recent.data ?? []).slice(0,5).map((entry) => <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" key={entry.id}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] ${entry.type === "income" ? "bg-[#e9f6ee] text-[#39936c]" : "bg-[#fff0ef] text-[#d8757c]"}`}>{entry.type === "income" ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}</span><div className="min-w-0 flex-1"><strong className="block truncate text-[13px] font-semibold text-[#46594b]">{entry.note || "รายการ"}</strong><small className="text-[11px] text-[#9aa49c]">{entry.occurred_on}</small></div><strong className={`whitespace-nowrap text-[13px] font-bold tabular-nums ${entry.type === "income" ? "text-[#328765]" : "text-[#d86c76]"}`}>{entry.type === "income" ? "+" : "−"}{money(entry.amount_satang)}</strong></div>)}</div>}
      </div>
    </section>
  </div>;
}
