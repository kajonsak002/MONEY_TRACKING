import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Target, LoaderCircle } from "lucide-react";
import { getMonthlyBudget, saveMonthlyBudget } from "../features/budget/budgetApi";
import { getEntriesInRange, summarizeEntries } from "../features/reports/reportApi";
function monthInfo() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const start = `${values.year}-${values.month}-01`;
  const lastDay = new Date(Number(values.year), Number(values.month), 0).getDate();
  return { start, end: `${values.year}-${values.month}-${String(lastDay).padStart(2, "0")}` };
}
const formatMoney = (satang: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(satang / 100);
export function BudgetPage() {
  const qc = useQueryClient();
  const month = monthInfo();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const budget = useQuery({ queryKey: ["budget", month.start], queryFn: () => getMonthlyBudget(month.start) });
  const entries = useQuery({ queryKey: ["report", month.start, month.end], queryFn: () => getEntriesInRange(month.start, month.end) });
  const summary = summarizeEntries(entries.data ?? []);
  const spent = summary.expense;
  const limit = budget.data?.limit_satang ?? 0;
  const percent = limit ? Math.min(100, spent / limit * 100) : 0;
  const save = useMutation({
    mutationFn: (value: number) => saveMonthlyBudget(month.start, value),
    onSuccess: async () => { setAmount(""); setError(""); await qc.invalidateQueries({ queryKey: ["budget", month.start] }); },
    onError: (e: Error) => setError(e.message),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || !/^\d+(\.\d{1,2})?$/.test(amount.trim())) { setError("กรุณากรอกงบประมาณที่มากกว่า 0 และไม่เกิน 2 ตำแหน่งทศนิยม"); return; }
    save.mutate(Math.round(value * 100));
  }
  return <div className="settings-page"><header className="page-title-row"><div><p className="eyebrow">MONTHLY PLAN</p><h1>งบประมาณรายเดือน</h1><p className="muted">{month.start.slice(0,7)}</p></div></header>
    <section className="report-balance-card"><span><Target size={14}/> ใช้จ่ายเดือนนี้</span><strong>{formatMoney(spent)}</strong><small>{limit ? `จากงบประมาณ ${formatMoney(limit)}` : "ยังไม่ได้ตั้งงบประมาณ"}</small>
      {limit > 0 && <><div className="budget-track"><i className={spent > limit ? "over" : ""} style={{width:`${percent}%`}}/></div><small>{Math.round(percent)}% · {spent > limit ? `เกินงบ ${formatMoney(spent-limit)}` : `เหลืองบ ${formatMoney(limit-spent)}`}</small></>}
    </section>
    <section className="settings-card"><h2>{limit ? "ปรับงบประมาณ" : "ตั้งงบประมาณ"}</h2><form className="category-add-form" onSubmit={(event) => submit(event)}><label className="entry-field">งบรายจ่ายต่อเดือน (บาท)<input type="number" min="0.01" step="0.01" placeholder={limit ? String(limit/100) : "เช่น 10000"} value={amount} onChange={(event) => setAmount(event.target.value)}/></label><button className="settings-primary" disabled={save.isPending}>{save.isPending ? "กำลังบันทึก..." : "บันทึกงบประมาณ"}</button></form>{error && <p className="entry-error">{error}</p>}</section>
    {budget.isLoading || entries.isLoading ? <div className="entry-loading"><LoaderCircle className="spin"/> กำลังโหลด...</div> : null}
  </div>;
}
