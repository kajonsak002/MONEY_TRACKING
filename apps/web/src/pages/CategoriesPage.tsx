import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Edit2,
  FolderPlus,
  LoaderCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  createCategory,
  deleteCategory,
  getManagedCategories,
  updateCategory,
} from "../features/categories/categoriesApi";
import type { EntryType } from "../features/entries/entriesApi";
import { CardGardenLedge, CardGinghamOverlay } from "../components/common/CardGrounding";

export function CategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<EntryType>("expense");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const query = useQuery({ queryKey: ["categories"], queryFn: getManagedCategories });
  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const add = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      setName("");
      setError("");
      await refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: deleteCategory,
    onSuccess: refresh,
    onError: (e: Error) => setError(e.message),
  });

  const edit = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => updateCategory(id, value),
    onSuccess: async () => { setEditingId(null); setEditingName(""); setError(""); await refresh(); },
    onError: (e: Error) => setError(e.message),
  });

  function saveEdit(id: string) {
    const value = editingName.trim();
    if (!value || value.length > 40) { setError("ชื่อหมวดหมู่ต้องมี 1–40 ตัวอักษร"); return; }
    setError("");
    edit.mutate({ id, value });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || name.trim().length > 40) {
      setError("ชื่อหมวดหมู่ต้องมี 1–40 ตัวอักษร");
      return;
    }
    add.mutate({ name: name.trim(), type });
  }

  const allCategories = query.data ?? [];
  const expenseCategories = allCategories.filter((c) => c.type === "expense");
  const incomeCategories = allCategories.filter((c) => c.type === "income");

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#438765] uppercase">
            Classification
          </span>
          <h1 className="text-2xl font-bold text-[#22392f] mt-0.5">
            จัดการหมวดหมู่
          </h1>
          <p className="text-xs text-[#71877c]">
            สร้างและปรับแต่งหมวดหมู่รายรับรายจ่ายให้ตรงกับการใช้งานของคุณ
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-[#e2ede0] text-[#4d6e5c] shadow-2xs self-start sm:self-auto">
          ทั้งหมด {allCategories.length} หมวดหมู่
        </span>
      </header>

      {/* ================= ADD CATEGORY ================= */}
      <section className="relative bg-gradient-to-b from-[#f6faf7] via-white to-[#eff7f2] rounded-3xl p-6 sm:p-7 border border-[#d2ead7] shadow-[0_8px_30px_rgba(42,78,56,0.05)] group transition-shadow hover:shadow-md overflow-visible">
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
          จัดหมวดหมู่ให้เป็นระเบียบนะ! 🏷️
        </span>

        <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <FolderPlus size={18} className="text-[#438765]" />
          <h2 className="text-base font-bold text-[#23382e]">เพิ่มหมวดหมู่ใหม่</h2>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Segmented Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#f4f7f2] rounded-2xl border border-[#e2ebe0] max-w-xs">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                type === "expense"
                  ? "bg-white text-[#dd5e6d] shadow-sm"
                  : "text-[#71877c] hover:text-[#23382e]"
              }`}
            >
              <ArrowUpRight size={15} strokeWidth={2.5} />
              <span>หมวดรายจ่าย</span>
            </button>

            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                type === "income"
                  ? "bg-white text-[#239667] shadow-sm"
                  : "text-[#71877c] hover:text-[#23382e]"
              }`}
            >
              <ArrowDownLeft size={15} strokeWidth={2.5} />
              <span>หมวดรายรับ</span>
            </button>
          </div>

          <div className="flex gap-2.5">
            <input
              required
              aria-label="ชื่อหมวดหมู่"
              maxLength={40}
              placeholder="ระบุชื่อหมวดหมู่ เช่น ค่าเดินทาง, โบนัส, อาหาร..."
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="flex-1 min-h-[46px] px-4 rounded-xl border border-[#dce7dc] bg-[#f8faf7] text-xs text-[#23382e] placeholder-[#a4b8ab] focus:border-[#438765] focus:bg-white focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={add.isPending || !name.trim()}
              className="px-5 min-h-[46px] rounded-xl bg-[#234835] hover:bg-[#1a3828] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50 shrink-0"
            >
              {add.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={16} />}
              <span>เพิ่มหมวดหมู่</span>
            </button>
          </div>

          {error && (
            <p className="text-xs text-[#bd4754] bg-[#fff0f2] p-3 rounded-xl border border-[#fbdbe1]" role="alert">
              {error}
            </p>
          )}
        </form>
        </div>
      </section>

      {query.isError && <p className="text-xs text-[#bd4754] bg-[#fff0f2] p-3 rounded-xl border border-[#fbdbe1]" role="alert">โหลดหมวดหมู่ไม่สำเร็จ: {query.error.message}</p>}
      {edit.isError && <p className="text-xs text-[#bd4754] bg-[#fff0f2] p-3 rounded-xl border border-[#fbdbe1]" role="alert">{edit.error.message}</p>}

      {/* ================= CATEGORIES LIST ================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <div className="bg-white rounded-3xl p-6 border border-[#e2ece0] shadow-[0_8px_30px_rgba(42,78,56,0.04)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#edf3ec]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#dd5e6d]">
              <ArrowUpRight size={16} strokeWidth={2.5} />
              <span>หมวดหมู่รายจ่าย ({expenseCategories.length})</span>
            </div>
          </div>

          {query.isLoading ? (
            <div className="py-8 flex justify-center"><LoaderCircle className="animate-spin text-[#438765]" size={20} /></div>
          ) : expenseCategories.length === 0 ? (
            <p className="text-xs text-[#71877c] py-4 text-center">ยังไม่มีหมวดหมู่รายจ่าย</p>
          ) : (
            <div className="divide-y divide-[#edf3eb]">
              {expenseCategories.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#dd5e6d] shrink-0" />
                    <strong className="text-[#23382e] truncate">{item.name}</strong>
                    {item.is_default && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#f4f7f3] text-[#71877c]">
                        ค่าเริ่มต้น
                      </span>
                    )}
                  </div>

                  {!item.is_default && (
                    <div className="flex items-center gap-1">
                      {editingId === item.id ? (
                        <>
                          <input autoFocus value={editingName} maxLength={40} aria-label="ชื่อหมวดหมู่ใหม่"
                            onChange={(event) => setEditingName(event.target.value)}
                            onKeyDown={(event) => { if (event.key === "Enter") saveEdit(item.id); if (event.key === "Escape") { setEditingId(null); setEditingName(""); } }}
                            className="min-h-[44px] w-32 sm:w-40 rounded-lg border border-[#9fc5a6] bg-white px-2 text-xs text-[#23382e] outline-none focus:ring-2 focus:ring-[#9fc5a6]/30" />
                          <button type="button" disabled={edit.isPending} onClick={() => saveEdit(item.id)} aria-label="บันทึกชื่อหมวดหมู่" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center p-1.5 rounded-lg text-[#239667] hover:bg-[#eaf7ef] disabled:opacity-50"><Check size={14}/></button>
                          <button type="button" onClick={() => { setEditingId(null); setEditingName(""); }} aria-label="ยกเลิกแก้ไข" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center p-1.5 rounded-lg text-[#71877c] hover:bg-[#f4f7f3]"><X size={14}/></button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => { setEditingId(item.id); setEditingName(item.name); setError(""); }} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center p-1.5 rounded-lg text-[#71877c] hover:text-[#23382e] hover:bg-[#edf5ee] transition" title="แก้ไข" aria-label={"แก้ไข " + item.name}>
                            <Edit2 size={13} />
                          </button>
                          <button type="button" disabled={remove.isPending} onClick={() => { if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${item.name}"?`)) remove.mutate(item.id); }} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center p-1.5 rounded-lg text-[#bd4754] hover:bg-[#fff0f2] transition disabled:opacity-50" title="ลบ" aria-label={"ลบ " + item.name}>
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Income Categories */}
        <div className="bg-white rounded-3xl p-6 border border-[#e2ece0] shadow-[0_8px_30px_rgba(42,78,56,0.04)]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#edf3ec]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#239667]">
              <ArrowDownLeft size={16} strokeWidth={2.5} />
              <span>หมวดหมู่รายรับ ({incomeCategories.length})</span>
            </div>
          </div>

          {query.isLoading ? (
            <div className="py-8 flex justify-center"><LoaderCircle className="animate-spin text-[#438765]" size={20} /></div>
          ) : incomeCategories.length === 0 ? (
            <p className="text-xs text-[#71877c] py-4 text-center">ยังไม่มีหมวดหมู่รายรับ</p>
          ) : (
            <div className="divide-y divide-[#edf3eb]">
              {incomeCategories.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#239667] shrink-0" />
                    <strong className="text-[#23382e] truncate">{item.name}</strong>
                    {item.is_default && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#f4f7f3] text-[#71877c]">
                        ค่าเริ่มต้น
                      </span>
                    )}
                  </div>

                  {!item.is_default && (
                    <div className="flex items-center gap-1">
                      {editingId === item.id ? (
                        <>
                          <input autoFocus value={editingName} maxLength={40} aria-label="ชื่อหมวดหมู่ใหม่"
                            onChange={(event) => setEditingName(event.target.value)}
                            onKeyDown={(event) => { if (event.key === "Enter") saveEdit(item.id); if (event.key === "Escape") { setEditingId(null); setEditingName(""); } }}
                            className="min-h-[34px] w-32 sm:w-40 rounded-lg border border-[#9fc5a6] bg-white px-2 text-xs text-[#23382e] outline-none focus:ring-2 focus:ring-[#9fc5a6]/30" />
                          <button type="button" disabled={edit.isPending} onClick={() => saveEdit(item.id)} aria-label="บันทึกชื่อหมวดหมู่" className="p-1.5 rounded-lg text-[#239667] hover:bg-[#eaf7ef] disabled:opacity-50"><Check size={14}/></button>
                          <button type="button" onClick={() => { setEditingId(null); setEditingName(""); }} aria-label="ยกเลิกแก้ไข" className="p-1.5 rounded-lg text-[#71877c] hover:bg-[#f4f7f3]"><X size={14}/></button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => { setEditingId(item.id); setEditingName(item.name); setError(""); }} className="p-1.5 rounded-lg text-[#71877c] hover:text-[#23382e] hover:bg-[#edf5ee] transition" title="แก้ไข" aria-label={"แก้ไข " + item.name}>
                            <Edit2 size={13} />
                          </button>
                          <button type="button" disabled={remove.isPending} onClick={() => { if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${item.name}"?`)) remove.mutate(item.id); }} className="p-1.5 rounded-lg text-[#bd4754] hover:bg-[#fff0f2] transition disabled:opacity-50" title="ลบ" aria-label={"ลบ " + item.name}>
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
