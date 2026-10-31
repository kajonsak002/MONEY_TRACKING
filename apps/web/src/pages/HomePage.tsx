import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, LoaderCircle, Plus, Sparkles } from "lucide-react";
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
      if (!value.type || !value.amount_thb || value.amount_thb <= 0) throw new Error("AI ยังอ่านประเภทหรือจำนวนเงินไม่ครบ กรุณาแก้ไขในหน้ารายการ");
      const category = (categories.data ?? []).find((item) => item.name === value.category_name && item.type === value.type);
      await createEntry({
        type: value.type,
        amount_satang: Math.round(value.amount_thb * 100),
        note: value.note,
        occurred_on: value.occurred_on,
        category_id: category?.id ?? null,
      });
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
  return <div className="home-page">
    <section className="welcome-row"><div><p className="eyebrow">{day}</p><h1>สวัสดี {greetingName}</h1><p className="muted">วันนี้การเงินของคุณเป็นอย่างไรบ้าง?</p></div><div className="avatar" aria-hidden="true"><img src="/assets/mascot-frog.svg" alt="" /></div></section>
    <section className="balance-card"><div className="balance-mascots" aria-hidden="true"><img className="balance-pig" src="/assets/mascot-pig.svg" alt="" /><img className="balance-frog" src="/assets/mascot-frog.svg" alt="" /></div><div className="balance-card-top"><span>ยอดสุทธิเดือนนี้</span><span className="balance-period">เดือนนี้</span></div><p className="balance-value">{report.isLoading ? "กำลังโหลด..." : money(totals.balance)}</p><div className="balance-divider"/><div className="balance-stats">
      <div><span className="stat-icon income-bg"><ArrowDownLeft size={16}/></span><div><small>รายรับ</small><strong className="income-text">{money(totals.income)}</strong></div></div>
      <div><span className="stat-icon expense-bg"><ArrowUpRight size={16}/></span><div><small>รายจ่าย</small><strong className="expense-text">{money(totals.expense)}</strong></div></div>
    </div></section>
    <section className="quick-add-card"><img className="quick-frog" src="/assets/mascot-frog.svg" alt="" aria-hidden="true" /><div className="section-heading"><div><p className="eyebrow">AI QUICK ADD</p><h2>เพิ่มรายการด้วยข้อความ</h2></div><Sparkles className="sparkle" size={22}/></div>
      <label className="quick-input-label" htmlFor="quick-entry">พิมพ์ภาษาธรรมชาติ เช่น “กินข้าว 60 บาทเมื่อเที่ยง”</label>
      <form className="quick-input-wrap" onSubmit={(event) => { event.preventDefault(); if (quickText.trim()) parseMutation.mutate(quickText.trim()); }}>
        <input id="quick-entry" value={quickText} onChange={(event) => { setQuickText(event.target.value); setDraft(null); }} maxLength={200} placeholder="เช่น เงินเดือน 30000 วันนี้" disabled={!configured || parseMutation.isPending}/>
        <button className="add-button" type="submit" disabled={!quickText.trim() || parseMutation.isPending} aria-label="วิเคราะห์รายการ">{parseMutation.isPending ? <LoaderCircle className="spin" size={19}/> : <Plus size={19}/>}</button>
      </form>
      <p className="helper-text">AI จะช่วยแยกประเภท จำนวนเงิน และวันที่ คุณต้องตรวจสอบก่อนบันทึกทุกครั้ง</p>
      {aiError && <p className="entry-error" role="alert">{aiError}</p>}
      {draft && <div className="quick-ai-preview"><strong>ตรวจสอบรายการก่อนบันทึก</strong>
        <label className="entry-field">ประเภท<select value={draft.type ?? ""} onChange={(e) => updateDraft("type", (e.target.value || null) as EntryType | null)}><option value="">เลือกประเภท</option><option value="expense">รายจ่าย</option><option value="income">รายรับ</option></select></label>
        <label className="entry-field">จำนวนเงิน (บาท)<input type="number" min="0.01" step="0.01" value={draft.amount_thb ?? ""} onChange={(e) => updateDraft("amount_thb", e.target.value ? Number(e.target.value) : null)}/></label>
        <label className="entry-field">วันที่<input type="date" value={draft.occurred_on} onChange={(e) => updateDraft("occurred_on", e.target.value)}/></label>
        <label className="entry-field">บันทึก<input maxLength={500} value={draft.note} onChange={(e) => updateDraft("note", e.target.value)}/></label>
        <p>หมวดหมู่ที่ AI แนะนำ: {categoryLabel}</p>
        <small>ความมั่นใจจาก AI: {Math.round(draft.confidence * 100)}% · ตรวจสอบข้อมูลด้วยตัวเองก่อนบันทึก</small>
        <div className="quick-ai-actions"><button type="button" disabled={saveMutation.isPending || !draft.type || !draft.amount_thb} onClick={() => saveMutation.mutate(draft)}>{saveMutation.isPending ? "กำลังบันทึก..." : "ยืนยันและบันทึก"}</button><button className="secondary" type="button" onClick={() => setDraft(null)}>ยกเลิก</button></div>
      </div>}
    </section>
    <section className="recent-section"><div className="section-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>รายการล่าสุด</h2></div><button className="text-action" type="button" onClick={() => navigate("/entries")}>ดูทั้งหมด</button></div>
      {recent.isLoading ? <div className="entry-loading"><LoaderCircle className="spin"/> กำลังโหลด...</div> : (recent.data ?? []).length === 0 ? <div className="empty-state"><img className="empty-mascot" src="/assets/mascot-pig.svg" alt="" /><strong>ยังไม่มีรายการ</strong><p>เริ่มบันทึกรายรับรายจ่ายของคุณได้เลย</p></div> : <div className="entry-list">{(recent.data ?? []).slice(0, 5).map((entry) => <div className="entry-row" key={entry.id}><span className={entry.type === "income" ? "entry-type-icon income-bg" : "entry-type-icon expense-bg"}>{entry.type === "income" ? <ArrowDownLeft size={17}/> : <ArrowUpRight size={17}/>}</span><div className="entry-main"><strong>{entry.note || "รายการ"}</strong><small>{entry.occurred_on}</small></div><strong className={entry.type === "income" ? "entry-amount income-text" : "entry-amount expense-text"}>{entry.type === "income" ? "+" : "−"}{money(entry.amount_satang)}</strong></div>)}</div>}
    </section>
  </div>;
}
