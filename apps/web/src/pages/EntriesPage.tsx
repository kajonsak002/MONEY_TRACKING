import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  LoaderCircle,
  Plus,
  Search,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { createEntry, getCategories, getEntries, type EntryType } from "../features/entries/entriesApi";
import { CardGardenLedge, CardGinghamOverlay } from "../components/common/CardGrounding";

function bangkokToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatMoney(satang: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(satang / 100);
}

function categoryFor(entry: { categories: { name: string } | { name: string }[] | null }) {
  return Array.isArray(entry.categories) ? entry.categories[0] ?? null : entry.categories;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(new Date(`${value}T12:00:00+07:00`));
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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategories, enabled: configured });
  const entriesQuery = useQuery({ queryKey: ["entries"], queryFn: getEntries, enabled: configured });

  const categories = useMemo(
    () => (categoriesQuery.data ?? []).filter((category) => category.type === type),
    [categoriesQuery.data, type]
  );

  const createMutation = useMutation({
    mutationFn: createEntry,
    onSuccess: async () => {
      setAmount("");
      setNote("");
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
      await queryClient.invalidateQueries({ queryKey: ["report"] });
    },
    onError: (error: Error) => setFormError(error.message || "บันทึกรายการไม่สำเร็จ"),
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

  const allEntries = useMemo(() => entriesQuery.data ?? [], [entriesQuery.data]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      if (filterType !== "all" && entry.type !== filterType) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const catName = categoryFor(entry)?.name?.toLowerCase() || "";
        const entryNote = entry.note?.toLowerCase() || "";
        if (!catName.includes(query) && !entryNote.includes(query)) return false;
      }
      return true;
    });
  }, [allEntries, filterType, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#438765] uppercase">
            Transaction Journal
          </span>
          <h1 className="text-2xl font-bold text-[#22392f] mt-0.5">
            รายการรายรับรายจ่าย
          </h1>
          <p className="text-xs text-[#71877c]">
            บันทึกและตรวจสอบประวัติการเงินของคุณได้อย่างละเอียด
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-[#e2ede0] text-[#4d6e5c] shadow-2xs">
            ทั้งหมด {allEntries.length} รายการ
          </span>
        </div>
      </header>

      {!configured && <p className="text-xs text-[#bd4754] bg-[#fff0f2] p-4 rounded-xl border border-[#fbdbe1]" role="alert">ยังไม่ได้ตั้งค่า Supabase กรุณาตรวจสอบการเชื่อมต่อก่อนใช้งาน</p>}
      {categoriesQuery.isError && <p className="text-xs text-[#bd4754] bg-[#fff0f2] p-3 rounded-xl border border-[#fbdbe1]" role="alert">โหลดหมวดหมู่ไม่สำเร็จ: {categoriesQuery.error.message}</p>}

      {/* ================= ADD TRANSACTION FORM ================= */}
      <section className="relative bg-gradient-to-b from-[#fdf6f7] via-white to-[#fbf5f6] rounded-3xl p-6 sm:p-7 border border-[#f9d7de] shadow-[0_8px_30px_rgba(42,78,56,0.05)] group transition-shadow hover:shadow-md overflow-visible">
        <CardGinghamOverlay opacity="opacity-[0.02]" />
        <CardGardenLedge className="right-6 w-24" />

        {/* Playful Pig Peeking Over Form Card */}
        <div className="absolute -top-9 right-8 w-16 h-16 pointer-events-none filter drop-shadow-[0_8px_16px_rgba(40,75,50,0.14)] group-hover:scale-105 group-hover:-rotate-3 transition-all duration-300 z-20">
          <img
            src="/images/mascots/pig-mascot-happy.png"
            alt="Pig Assistant"
            className="w-full h-full object-contain"
          />
        </div>
        {/* Speech Bubble Tag */}
        <span className="hidden sm:inline-flex absolute -top-8 right-26 items-center gap-1 px-3 py-1 rounded-full bg-white/95 border border-[#fbdbe1] text-[10px] font-bold text-[#dd5e6d] shadow-xs backdrop-blur-xs z-20">
          จดทุกวัน ออมเงินได้เยอะขึ้นนะ! 🌸
        </span>

        <div className="relative z-10">

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#ebf5ee] text-[#2c5a42] flex items-center justify-center">
              <Plus size={18} strokeWidth={2.5} />
            </span>
            <h2 className="text-base font-bold text-[#23382e]">เพิ่มรายการใหม่</h2>
          </div>
          <span className="text-[11px] text-[#71877c]">ระบุข้อมูลรายการ</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Segmented Type Toggle (Matching ref-2.png) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#f4f7f2] rounded-2xl border border-[#e2ebe0] max-w-md">
            <button
              type="button"
              aria-pressed={type === "expense"}
              onClick={() => {
                setType("expense");
                setCategoryId("");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                type === "expense"
                  ? "bg-white text-[#dd5e6d] shadow-sm"
                  : "text-[#71877c] hover:text-[#23382e]"
              }`}
            >
              <ArrowUpRight size={16} strokeWidth={2.5} />
              <span>รายจ่าย</span>
            </button>

            <button
              type="button"
              aria-pressed={type === "income"}
              onClick={() => {
                setType("income");
                setCategoryId("");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                type === "income"
                  ? "bg-white text-[#239667] shadow-sm"
                  : "text-[#71877c] hover:text-[#23382e]"
              }`}
            >
              <ArrowDownLeft size={16} strokeWidth={2.5} />
              <span>รายรับ</span>
            </button>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* Amount Field */}
            <div>
              <label className="block text-xs font-semibold text-[#506c5e] mb-1.5">
                จำนวนเงิน (บาท) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8ba395]">
                  ฿
                </span>
                <input
                  required
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full min-h-[46px] pl-8 pr-4 rounded-xl border border-[#dce7dc] bg-[#f8faf7] text-sm font-bold text-[#23382e] placeholder-[#a4b8ab] focus:border-[#438765] focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            {/* Category Field */}
            <div>
              <label className="block text-xs font-semibold text-[#506c5e] mb-1.5">
                หมวดหมู่
              </label>
              <select
                value={categoryId}
                disabled={!configured || categoriesQuery.isLoading || categoriesQuery.isError}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#dce7dc] bg-[#f8faf7] text-xs font-medium text-[#23382e] focus:border-[#438765] focus:bg-white focus:outline-none transition"
              >
                <option value="">ไม่ระบุหมวดหมู่</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Field */}
            <div>
              <label className="block text-xs font-semibold text-[#506c5e] mb-1.5">
                วันที่ทำรายการ *
              </label>
              <input
                required
                type="date"
                value={occurredOn}
                onChange={(e) => setOccurredOn(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-[#dce7dc] bg-[#f8faf7] text-xs font-medium text-[#23382e] focus:border-[#438765] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* Note Field */}
          <div>
            <label className="block text-xs font-semibold text-[#506c5e] mb-1.5">
              บันทึกช่วยจำ (ถ้ามี)
            </label>
            <input
              type="text"
              maxLength={500}
              placeholder="เช่น อาหารกลางวันกับเพื่อน, ค่าชานมไข่มุก..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full min-h-[44px] px-4 rounded-xl border border-[#dce7dc] bg-[#f8faf7] text-xs text-[#23382e] placeholder-[#a4b8ab] focus:border-[#438765] focus:bg-white focus:outline-none transition"
            />
          </div>

          {formError && (
            <p className="text-xs text-[#bd4754] bg-[#fff0f2] p-3 rounded-xl border border-[#fbdbe1]" role="alert">
              {formError}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!configured || createMutation.isPending}
              className="px-6 py-3 rounded-2xl bg-[#234835] hover:bg-[#1a3828] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              <span>{createMutation.isPending ? "กำลังบันทึก..." : "บันทึกรายการ"}</span>
            </button>
          </div>
        </form>
        </div>
      </section>

      {/* ================= SEARCH & FILTER TOOLBAR ================= */}
      <section className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f988b]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามโน้ต หรือชื่อหมวดหมู่..."
            className="w-full min-h-[42px] pl-9 pr-4 rounded-2xl border border-[#dce7dc] bg-white text-xs text-[#23382e] placeholder-[#9fb3a6] focus:border-[#438765] focus:outline-none shadow-2xs transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#dce7dc] shadow-2xs self-start sm:self-auto">
          {(
            [
              { id: "all", label: "ทั้งหมด" },
              { id: "income", label: "รายรับ" },
              { id: "expense", label: "รายจ่าย" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterType(item.id)}
              aria-pressed={filterType === item.id}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === item.id
                  ? "bg-[#234835] text-white shadow-xs"
                  : "text-[#6c8678] hover:bg-[#f4f8f3]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* ================= TRANSACTIONS LIST ================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e2ece0] shadow-[0_8px_30px_rgba(42,78,56,0.04)]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[#23382e]">ประวัติรายการทั้งหมด</h2>
          <span className="text-xs text-[#8ca194]">
            {filteredEntries.length} รายการที่ตรงตามเงื่อนไข
          </span>
        </div>

        {entriesQuery.isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-xs text-[#71877c] gap-2">
            <LoaderCircle size={24} className="animate-spin text-[#438765]" />
            <span>กำลังโหลดรายการ...</span>
          </div>
        ) : entriesQuery.isError ? (
          <div className="py-12 text-center text-xs text-[#bd4754]" role="alert">
            โหลดรายการไม่สำเร็จ: {entriesQuery.error.message}
          </div>
        ) : filteredEntries.length === 0 ? (
          /* Empty State */
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-36 h-36 mb-3">
              <img
                src="/images/empty-states/empty-transactions.png"
                alt="No transactions found"
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            </div>
            <strong className="text-sm font-bold text-[#23382e]">
              {searchQuery ? "ไม่พบรายการที่ตรงกับการค้นหา" : "ยังไม่มีรายการ"}
            </strong>
            <p className="text-xs text-[#71877c] max-w-sm mt-1">
              {searchQuery
                ? "ลองเปลี่ยนคำค้นหา หรือเปลี่ยนตัวกรองดูนะ"
                : "เริ่มบันทึกรายการแรกผ่านฟอร์มด้านบนได้เลย"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#edf3eb]">
            {filteredEntries.map((entry) => {
              const category = categoryFor(entry);
              const isIncome = entry.type === "income";

              return (
                <article
                  key={entry.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-[#fbfcfb] px-2 rounded-xl transition"
                >
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
                        {formatDate(entry.occurred_on)}
                      </span>
                    </div>
                  </div>

                  <strong
                    className={`text-sm font-bold tabular-nums whitespace-nowrap ${
                      isIncome ? "text-[#239667]" : "text-[#dd5e6d]"
                    }`}
                  >
                    {isIncome ? "+" : "−"}
                    {formatMoney(entry.amount_satang)}
                  </strong>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
