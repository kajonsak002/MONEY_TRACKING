import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Target, Wallet } from "lucide-react";
import { getMonthlyBudget, saveMonthlyBudget } from "../features/budget/budgetApi";
import { getEntriesInRange, summarizeEntries } from "../features/reports/reportApi";
import { useAuth } from "../auth/AuthProvider";

function monthInfo() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const start = `${values.year}-${values.month}-01`;
  const lastDay = new Date(Number(values.year), Number(values.month), 0).getDate();
  return { start, end: `${values.year}-${values.month}-${String(lastDay).padStart(2, "0")}` };
}
const formatMoney = (satang: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(satang / 100);

export function BudgetPage() {
  const { configured } = useAuth();
  const qc = useQueryClient();
  const month = monthInfo();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const budget = useQuery({ queryKey: ["budget", month.start], queryFn: () => getMonthlyBudget(month.start), enabled: configured });
  const entries = useQuery({ queryKey: ["report", month.start, month.end], queryFn: () => getEntriesInRange(month.start, month.end), enabled: configured });
  const summary = summarizeEntries(entries.data ?? []);
  const spent = summary.expense;
  const limit = budget.data?.limit_satang ?? 0;
  const percent = limit ? spent / limit * 100 : 0;
  const remaining = limit - spent;
  const save = useMutation({
    mutationFn: (value: number) => saveMonthlyBudget(month.start, value),
    onSuccess: async () => { setAmount(""); setError(""); await qc.invalidateQueries({ queryKey: ["budget", month.start] }); },
    onError: (e: Error) => setError(e.message),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || !/^\d+(\.\d{1,2})?$/.test(amount.trim())) { setError("กรุณากรอกงบประมาณที่มากกว่า 0 และไม่เกิน 2 ตำแหน่งทศนิยม"); return; }
    setError("");
    save.mutate(Math.round(value * 100));
  }

  return <div className="settings-page">
    <header className="page-title-row"><div><p className="eyebrow">MONTHLY PLAN</p><h1>งบประมาณรายเดือน</h1><p className="muted">วางแผนค่าใช้จ่ายและติดตามการใช้เงินของเดือนนี้</p></div></header>
    {!configured ? <p className="auth-notice" role="status">ยังไม่ได้ตั้งค่า Supabase กรุณาตรวจสอบการเชื่อมต่อก่อนใช้งาน</p> : <>
      {budget.isLoading || entries.isLoading ? <div className="entry-loading"><LoaderCircle className="spin"/> กำลังโหลดงบประมาณ...</div>
      : budget.isError || entries.isError ? <p className="entry-error" role="alert">{budget.error?.message ?? entries.error?.message}</p> : <>
        <section className="report-balance-card budget-overview-card">
          <span><Target size={15}/> งบประมาณเดือน {month.start.slice(0, 7)}</span>
          <strong>{limit ? formatMoney(limit) : "ยังไม่ได้ตั้งงบ"}</strong>
          <small>{limit ? `ใช้ไปแล้ว ${formatMoney(spent)} จากงบที่ตั้งไว้` : "ตั้งงบประมาณเพื่อเริ่มติดตามการใช้จ่าย"}</small>
          {limit > 0 && <>
            <div className="budget-track"><i className={spent > limit ? "over" : ""} style={{ width: `${Math.min(100, percent)}%` }}/></div>
            <div className="budget-summary-line"><span>{Math.round(percent)}% ของงบประมาณ</span><strong className={remaining < 0 ? "expense-text" : ""}>{remaining < 0 ? `เกินงบ ${formatMoney(Math.abs(remaining))}` : `เหลือ ${formatMoney(remaining)}`}</strong></div>
          </>}
        </section>
        <section className="report-stats">
          <article><span className="report-stat-icon expense-bg"><Wallet size={17}/></span><small>รายจ่ายเดือนนี้</small><strong className="expense-text">{formatMoney(spent)}</strong></article>
          <article><span className="report-stat-icon"><Target size={17}/></span><small>งบประมาณที่ตั้งไว้</small><strong>{limit ? formatMoney(limit) : "—"}</strong></article>
        </section>
      </>}
      <section className="settings-card">
        <h2>{limit ? "ปรับงบประมาณ" : "ตั้งงบประมาณ"}</h2>
        <p className="muted">กำหนดวงเงินรวมสำหรับรายจ่ายทั้งหมดของเดือนปัจจุบัน</p>
        <form className="category-add-form" onSubmit={submit}>
          <label className="entry-field">งบรายจ่ายต่อเดือน (บาท)<input type="number" inputMode="decimal" min="0.01" step="0.01" placeholder={limit ? String(limit / 100) : "เช่น 10000"} value={amount} onChange={(event) => setAmount(event.target.value)}/></label>
          <button className="settings-primary" disabled={save.isPending || !amount.trim()}>{save.isPending ? <LoaderCircle size={16} className="spin"/> : <Target size={16}/>} {save.isPending ? "กำลังบันทึก..." : "บันทึกงบประมาณ"}</button>
        </form>
        {error && <p className="entry-error" role="alert">{error}</p>}
      </section>
    </>}
  </div>;
}
