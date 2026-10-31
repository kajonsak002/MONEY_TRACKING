import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { createCategory, deleteCategory, getManagedCategories, updateCategory } from "../features/categories/categoriesApi";
import type { EntryType } from "../features/entries/entriesApi";
import { useAuth } from "../auth/AuthProvider";

export function CategoriesPage() {
  const { configured } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<EntryType>("expense");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");
  const query = useQuery({ queryKey: ["categories"], queryFn: getManagedCategories, enabled: configured });
  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });
  const add = useMutation({ mutationFn: createCategory, onSuccess: async () => { setName(""); setError(""); await refresh(); }, onError: (e: Error) => setError(e.message) });
  const edit = useMutation({ mutationFn: ({ id, value }: { id: string; value: string }) => updateCategory(id, value), onSuccess: async () => { setEditingId(null); setEditingName(""); setError(""); await refresh(); }, onError: (e: Error) => setError(e.message) });
  const remove = useMutation({ mutationFn: deleteCategory, onSuccess: refresh, onError: (e: Error) => setError(e.message) });

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = name.trim();
    if (!value || value.length > 40) { setError("ชื่อหมวดหมู่ต้องมี 1–40 ตัวอักษร"); return; }
    setError("");
    add.mutate({ name: value, type });
  }
  function saveEdit(id: string) {
    const value = editingName.trim();
    if (!value || value.length > 40) { setError("ชื่อหมวดหมู่ต้องมี 1–40 ตัวอักษร"); return; }
    setError("");
    edit.mutate({ id, value });
  }

  return <div className="settings-page">
    <header className="page-title-row"><div><p className="eyebrow">CUSTOMIZE</p><h1>จัดการหมวดหมู่</h1><p className="muted">จัดหมวดหมู่รายรับและรายจ่ายให้ตรงกับการใช้งานของคุณ</p></div></header>
    {!configured && <p className="auth-notice" role="status">ยังไม่ได้ตั้งค่า Supabase กรุณาตรวจสอบการเชื่อมต่อก่อนใช้งาน</p>}
    <section className="settings-card">
      <h2>เพิ่มหมวดหมู่ใหม่</h2>
      <form className="category-add-form" onSubmit={submit}>
        <div className="entry-type-switch" role="group" aria-label="ประเภทหมวดหมู่">
          <button type="button" className={type === "expense" ? "selected expense-selected" : ""} onClick={() => setType("expense")}>รายจ่าย</button>
          <button type="button" className={type === "income" ? "selected income-selected" : ""} onClick={() => setType("income")}>รายรับ</button>
        </div>
        <input aria-label="ชื่อหมวดหมู่" maxLength={40} placeholder="เช่น ค่าเดินทาง" value={name} onChange={(event) => setName(event.target.value)} disabled={!configured}/>
        <button className="settings-primary" type="submit" disabled={!configured || add.isPending || !name.trim()}>{add.isPending ? <LoaderCircle size={16} className="spin"/> : <Plus size={16}/>} {add.isPending ? "กำลังเพิ่ม..." : "เพิ่มหมวดหมู่"}</button>
      </form>
    </section>
    <section className="settings-card">
      <div className="section-heading"><h2>หมวดหมู่ทั้งหมด</h2><span className="entry-count">{query.data?.length ?? 0} หมวดหมู่</span></div>
      {query.isLoading ? <div className="entry-loading"><LoaderCircle className="spin"/> กำลังโหลดหมวดหมู่...</div>
      : query.isError ? <p className="entry-error" role="alert">{query.error.message}</p>
      : !query.data?.length ? <div className="empty-state"><strong>ยังไม่มีหมวดหมู่</strong><p>เพิ่มหมวดหมู่แรกเพื่อจัดระเบียบรายการของคุณ</p></div>
      : query.data.map((item) => <div className="category-manage-row" key={item.id}>
        <span className={item.type === "income" ? "income-text" : "expense-text"}>{item.type === "income" ? "รายรับ" : "รายจ่าย"}</span>
        {editingId === item.id ? <>
          <input className="category-edit-input" aria-label="ชื่อหมวดหมู่ใหม่" maxLength={40} value={editingName} onChange={(event) => setEditingName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveEdit(item.id); if (event.key === "Escape") setEditingId(null); }} autoFocus/>
          <div className="category-manage-actions">
            <button type="button" aria-label="บันทึกชื่อหมวดหมู่" disabled={edit.isPending} onClick={() => saveEdit(item.id)}><Check size={15}/></button>
            <button type="button" aria-label="ยกเลิกแก้ไข" onClick={() => { setEditingId(null); setEditingName(""); }}><X size={15}/></button>
          </div>
        </> : <>
          <strong>{item.name}</strong>
          {item.is_default ? <small>ค่าเริ่มต้น</small> : <div className="category-manage-actions">
            <button type="button" aria-label={`แก้ไข ${item.name}`} onClick={() => { setEditingId(item.id); setEditingName(item.name); setError(""); }}><Pencil size={14}/></button>
            <button type="button" aria-label={`ลบ ${item.name}`} disabled={remove.isPending} onClick={() => { if (window.confirm(`ลบหมวดหมู่ “${item.name}” ใช่หรือไม่?`)) remove.mutate(item.id); }}><Trash2 size={15}/></button>
          </div>}
        </>}
      </div>)}
      {(error || edit.isError || remove.isError) && <p className="entry-error" role="alert">{error || edit.error?.message || remove.error?.message}</p>}
    </section>
  </div>;
}
