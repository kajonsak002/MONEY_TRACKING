import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "../design-system/primitives/Button";
import { useAuth } from "../auth/AuthProvider";
import { createEntry, getCategories, getEntries, softDeleteEntry, type EntryType } from "../features/entries/entriesApi";

function bangkokToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatMoney(satang: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 2 }).format(satang / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date(`${value}T12:00:00+07:00`));
}

export function EntriesPage() {
  const { configured } = useAuth();
  const queryClient = useQueryClient();
  const [type, setType] = useState<EntryType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [occurredOn, setOccurredOn] = useState(bangkokToday());
  const [formError, setFormError] = useState<string | null>(null);

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategories, enabled: configured });
  const entriesQuery = useQuery({ queryKey: ["entries"], queryFn: getEntries, enabled: configured });

  const categories = useMemo(
    () => (categoriesQuery.data ?? []).filter((category) => category.type === type),
    [categoriesQuery.data, type],
  );

  const createMutation = useMutation({
    mutationFn: createEntry,
    onSuccess: async () => {
      setAmount(""); setNote(""); setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
    onError: (error: Error) => setFormError(error.message || "บันทึกรายการไม่สำเร็จ"),
  });

  const deleteMutation = useMutation({
    mutationFn: softDeleteEntry,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["entries"] }),
    onError: (error: Error) => setFormError(error.message || "ลบรายการไม่สำเร็จ"),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      setFormError("กรุณากรอกจำนวนเงินมากกว่า 0 และไม่เกิน 2 ตำแหน่งทศนิยม");
      return;
    }
    if (!occurredOn) {
      setFormError("กรุณาเลือกวันที่");
      return;
    }
    setFormError(null);
    await createMutation.mutateAsync({
      type,
      amount_satang: Math.round(parsedAmount * 100),
      note: note.trim(),
      occurred_on: occurredOn,
      category_id: categoryId || null,
    });
  }

  const entries = entriesQuery.data ?? [];

  return (
    <div className="entries-page">
      <header className="page-title-row">
        <div><p className="eyebrow">MONEY JOURNAL</p><h1>รายการรายรับรายจ่าย</h1><p className="muted">บันทึกและติดตามทุกการเคลื่อนไหวของเงิน</p></div>
      </header>

      <section className="entry-form-card">
        <div className="section-heading"><div><p className="eyebrow">NEW TRANSACTION</p><h2>เพิ่มรายการ</h2></div><span className="entry-form-icon"><Plus size={18} /></span></div>
        {!configured ? <p className="auth-notice">ยังไม่ได้ตั้งค่า Supabase กรุณาเพิ่ม Environment Variables ก่อนใช้งาน</p> : (
          <form className="entry-form" onSubmit={(event) => void handleSubmit(event)}>
            <div className="entry-type-switch" role="group" aria-label="ประเภทรายการ">
              <button type="button" className={type === "expense" ? "selected expense-selected" : ""} onClick={() => { setType("expense"); setCategoryId(""); }}> <ArrowUpRight size={17} /> รายจ่าย</button>
              <button type="button" className={type === "income" ? "selected income-selected" : ""} onClick={() => { setType("income"); setCategoryId(""); }}> <ArrowDownLeft size={17} /> รายรับ</button>
            </div>
            <label className="entry-field"><span>จำนวนเงิน (บาท) *</span><input required type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
            <div className="entry-form-grid">
              <label className="entry-field"><span>หมวดหมู่</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">ไม่ระบุหมวดหมู่</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="entry-field"><span>วันที่ *</span><input required type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} /></label>
            </div>
            <label className="entry-field"><span>บันทึกเพิ่มเติม</span><input maxLength={500} placeholder="เช่น ข้าวกลางวัน, ค่าเดินทาง" value={note} onChange={(event) => setNote(event.target.value)} /></label>
            {formError && <p className="entry-error" role="alert">{formError}</p>}
            <Button type="submit" size="lg" disabled={createMutation.isPending} className="entry-submit">
              {createMutation.isPending ? <LoaderCircle size={17} className="spin" /> : <Plus size={17} />}
              {createMutation.isPending ? "กำลังบันทึก..." : "บันทึกรายการ"}
            </Button>
          </form>
        )}
      </section>

      <section className="entry-list-section">
        <div className="section-heading"><div><p className="eyebrow">ACTIVITY</p><h2>ประวัติรายการ</h2></div><span className="entry-count">{entries.length} รายการล่าสุด</span></div>
        {entriesQuery.isLoading ? <div className="entry-loading"><LoaderCircle className="spin" size={20} /> กำลังโหลดรายการ...</div> :
          entriesQuery.isError ? <div className="entry-error" role="alert">{(entriesQuery.error as Error).message}</div> :
          entries.length === 0 ? <div className="empty-state"><div className="empty-icon">฿</div><strong>ยังไม่มีรายการ</strong><p>เพิ่มรายรับหรือรายจ่ายรายการแรกของคุณได้เลย</p></div> :
          <div className="entry-list">{entries.map((entry) => (
            <article className="entry-row" key={entry.id}>
              <span className={entry.type === "income" ? "entry-type-icon income-bg" : "entry-type-icon expense-bg"}>{entry.type === "income" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</span>
              <div className="entry-main"><strong>{entry.note || entry.categories?.name || (entry.type === "income" ? "รายรับ" : "รายจ่าย")}</strong><small>{entry.categories?.name ? `${entry.categories.name} · ` : ""}{formatDate(entry.occurred_on)}</small></div>
              <strong className={entry.type === "income" ? "entry-amount income-text" : "entry-amount expense-text"}>{entry.type === "income" ? "+" : "−"}{formatMoney(entry.amount_satang)}</strong>
              <button className="entry-delete" type="button" aria-label="ลบรายการ" title="ลบรายการ" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm("ต้องการลบรายการนี้ใช่หรือไม่?")) deleteMutation.mutate(entry.id); }}><Trash2 size={16} /></button>
            </article>
          ))}</div>
        }
      </section>
    </div>
  );
}
