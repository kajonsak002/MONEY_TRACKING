import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, LoaderCircle } from "lucide-react";
import { createCategory, deleteCategory, getManagedCategories, updateCategory } from "../features/categories/categoriesApi";
import type { EntryType } from "../features/entries/entriesApi";

export function CategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<EntryType>("expense");
  const [error, setError] = useState("");
  const query = useQuery({ queryKey: ["categories"], queryFn: getManagedCategories });
  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });
  const add = useMutation({ mutationFn: createCategory, onSuccess: async () => { setName(""); setError(""); await refresh(); }, onError: (e: Error) => setError(e.message) });
  const remove = useMutation({ mutationFn: deleteCategory, onSuccess: refresh, onError: (e: Error) => setError(e.message) });
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || name.trim().length > 40) { setError("ชื่อหมวดหมู่ต้องมี 1–40 ตัวอักษร"); return; }
    add.mutate({ name, type });
  }
  return <div className="settings-page"><header className="page-title-row"><div><p className="eyebrow">CUSTOMIZE</p><h1>จัดการหมวดหมู่</h1><p className="muted">เพิ่ม แก้ไข หรือลบหมวดหมู่ของคุณ</p></div></header>
    <section className="settings-card"><h2>เพิ่มหมวดหมู่ใหม่</h2><form className="category-add-form" onSubmit={(event) => void submit(event)}>
      <div className="entry-type-switch"><button type="button" className={type === "expense" ? "selected expense-selected" : ""} onClick={() => setType("expense")}>รายจ่าย</button><button type="button" className={type === "income" ? "selected income-selected" : ""} onClick={() => setType("income")}>รายรับ</button></div>
      <input aria-label="ชื่อหมวดหมู่" maxLength={40} placeholder="เช่น ค่าเดินทาง" value={name} onChange={(event) => setName(event.target.value)}/>
      <button className="settings-primary" type="submit" disabled={add.isPending}><Plus size={16}/> เพิ่มหมวดหมู่</button>
    </form>{error && <p className="entry-error" role="alert">{error}</p>}</section>
    <section className="settings-card"><h2>หมวดหมู่ทั้งหมด</h2>{query.isLoading ? <LoaderCircle className="spin"/> : query.isError ? <p className="entry-error">{(query.error as Error).message}</p> : (query.data ?? []).map((item) =>
      <div className="category-manage-row" key={item.id}><span className={item.type === "income" ? "income-text" : "expense-text"}>{item.type === "income" ? "รายรับ" : "รายจ่าย"}</span><strong>{item.name}</strong>{item.is_default ? <small>ค่าเริ่มต้น</small> : <div className="category-manage-actions"><button type="button" onClick={() => { const next = window.prompt("แก้ไขชื่อหมวดหมู่", item.name); if (next?.trim()) void updateCategory(item.id, next).then(refresh).catch((e: Error) => setError(e.message)); }}>แก้ไข</button><button type="button" aria-label={`ลบ ${item.name}`} onClick={() => { if (window.confirm(`ลบหมวดหมู่ ${item.name} ?`)) remove.mutate(item.id); }}><Trash2 size={15}/></button></div>}</div>)}</section>
  </div>;
}
