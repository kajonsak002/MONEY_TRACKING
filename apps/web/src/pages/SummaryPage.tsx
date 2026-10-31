import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, LoaderCircle } from "lucide-react";
import { getEntriesInRange, summarizeEntries } from "../features/reports/reportApi";
import { useAuth } from "../auth/AuthProvider";

type Period = "month" | "year" | "custom";
function dateInBangkok() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { year: values.year!, month: values.month!, day: values.day! };
}
function money(value: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(value / 100);
}
function relationName(entry: { categories: { name: string } | { name: string }[] | null }) {
  return Array.isArray(entry.categories) ? entry.categories[0]?.name : entry.categories?.name;
}

export function SummaryPage() {
  const { configured } = useAuth();
  const today = dateInBangkok();
  const [period, setPeriod] = useState<Period>("month");
  const [from, setFrom] = useState(`${today.year}-${today.month}-01`);
  const [to, setTo] = useState(`${today.year}-${today.month}-${today.day}`);
  const range = useMemo(() => {
    if (period === "year") return { from: `${today.year}-01-01`, to: `${today.year}-12-31` };
    if (period === "month") {
      const last = new Date(Number(today.year), Number(today.month), 0).getDate();
      return { from: `${today.year}-${today.month}-01`, to: `${today.year}-${today.month}-${String(last).padStart(2, "0")}` };
    }
    return { from, to };
  }, [period, from, to, today.year, today.month]);
  const query = useQuery({
    queryKey: ["report", range.from, range.to],
    queryFn: () => getEntriesInRange(range.from, range.to),
    enabled: configured && range.from <= range.to,
  });
  const summary = useMemo(() => summarizeEntries(query.data ?? []), [query.data]);
  const maxDaily = Math.max(1, ...summary.byDay.map((day) => Math.max(day.income, day.expense)));
  const expenseCategories = summary.byCategory.filter((item) => item.type === "expense").slice(0, 8);

  return <div className="report-page">
    <header className="page-title-row"><div><p className="eyebrow">INSIGHTS</p><h1>สรุปการเงิน</h1><p className="muted">ดูภาพรวมรายรับ รายจ่าย และยอดคงเหลือ</p></div></header>
    <section className="report-filter-card">
      <div className="period-switch">
        {([{ key: "month", label: "เดือนนี้" }, { key: "year", label: "ปีนี้" }, { key: "custom", label: "กำหนดเอง" }] as const).map((item) =>
          <button key={item.key} type="button" aria-pressed={period === item.key} className={period === item.key ? "active" : ""} onClick={() => setPeriod(item.key)}>{item.label}</button>)}
      </div>
      {period === "custom" && <div className="report-date-range">
        <label>ตั้งแต่<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} /></label>
        <label>ถึงวันที่<input type="date" value={to} min={from} max={`${today.year}-${today.month}-${today.day}`} onChange={(event) => setTo(event.target.value)} /></label>
      </div>}
      <p className="report-range"><CalendarDays size={14} /> {range.from} ถึง {range.to}</p>
    </section>
    {query.isLoading ? <div className="entry-loading"><LoaderCircle className="spin" /> กำลังคำนวณ...</div> :
    query.isError ? <p className="entry-error">{(query.error as Error).message}</p> : <>
      {(query.data ?? []).length === 0 && <div className="ui-empty-state"><strong>ยังไม่มีข้อมูลในช่วงเวลานี้</strong><p>ลองเลือกช่วงวันที่อื่น หรือเพิ่มรายการรายรับรายจ่ายก่อน</p></div>}\n      <section className="report-balance-card"><span>เงินสุทธิในช่วงเวลานี้</span><strong>{money(summary.balance)}</strong><small>{summary.count} รายการ</small></section>
      <section className="report-stats">
        <article><span className="report-stat-icon income-bg"><ArrowDownLeft size={17}/></span><small>รายรับทั้งหมด</small><strong className="income-text">{money(summary.income)}</strong></article>
        <article><span className="report-stat-icon expense-bg"><ArrowUpRight size={17}/></span><small>รายจ่ายทั้งหมด</small><strong className="expense-text">{money(summary.expense)}</strong></article>
      </section>
      <section className="report-card"><div className="section-heading"><h2>แนวโน้มรายวัน</h2><small>หน่วย: บาท</small></div>
        {summary.byDay.length === 0 ? <p className="muted">ยังไม่มีข้อมูลในช่วงเวลานี้</p> :
          <div className="daily-chart">{summary.byDay.slice(-31).map((day) => <div className="daily-chart-col" key={day.date} title={`${day.date}: รายรับ ${money(day.income)} / รายจ่าย ${money(day.expense)}`}>
            <div className="daily-bars"><span className="daily-bar income-bar" style={{ height: `${Math.max(day.income ? 3 : 0, day.income / maxDaily * 100)}%` }}/><span className="daily-bar expense-bar" style={{ height: `${Math.max(day.expense ? 3 : 0, day.expense / maxDaily * 100)}%` }}/></div>
            <small>{day.date.slice(8)}</small></div>)}</div>}
        <div className="chart-legend"><span><i className="income-bar"/> รายรับ</span><span><i className="expense-bar"/> รายจ่าย</span></div>
      </section>
      <section className="report-card"><div className="section-heading"><h2>รายจ่ายตามหมวดหมู่</h2></div>
        {expenseCategories.length === 0 ? <p className="muted">ยังไม่มีรายจ่าย</p> : expenseCategories.map((item) => {
          const percent = summary.expense ? item.amount / summary.expense * 100 : 0;
          return <div className="category-report-row" key={item.name}><div><strong>{item.name}</strong><span>{money(item.amount)}</span></div><div className="category-track"><i style={{ width: `${percent}%` }}/></div></div>;
        })}
      </section>
      <section className="report-card"><h2>รายการในช่วงเวลานี้</h2>{(query.data ?? []).slice().reverse().slice(0, 10).map((entry) =>
        <div className="report-entry" key={entry.id}><span>{entry.note || relationName(entry) || "รายการ"}</span><strong className={entry.type === "income" ? "income-text" : "expense-text"}>{entry.type === "income" ? "+" : "−"}{money(entry.amount_satang)}</strong></div>)}</section>
    </>}
  </div>;
}
