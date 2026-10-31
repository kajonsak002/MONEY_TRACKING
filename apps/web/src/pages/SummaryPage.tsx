import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  LoaderCircle,
  PieChart,
  Wallet,
} from "lucide-react";
import { getEntriesInRange, summarizeEntries } from "../features/reports/reportApi";
import { useAuth } from "../auth/AuthProvider";
import { CardGinghamOverlay } from "../components/common/CardGrounding";

type Period = "month" | "year" | "custom";

function dateInBangkok() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { year: values.year!, month: values.month!, day: values.day! };
}

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
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
      return {
        from: `${today.year}-${today.month}-01`,
        to: `${today.year}-${today.month}-${String(last).padStart(2, "0")}`,
      };
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

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#438765] uppercase">
            Financial Insights
          </span>
          <h1 className="text-2xl font-bold text-[#22392f] mt-0.5">
            สรุปรายงานการเงิน
          </h1>
          <p className="text-xs text-[#71877c]">
            วิเคราะห์แนวโน้มรายรับ รายจ่าย และโครงสร้างค่าใช้จ่ายตามหมวดหมู่
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#dce7dc] shadow-2xs self-start sm:self-auto">
          {(
            [
              { key: "month", label: "เดือนนี้" },
              { key: "year", label: "ปีนี้" },
              { key: "custom", label: "กำหนดเอง" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setPeriod(item.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                period === item.key
                  ? "bg-[#234835] text-white shadow-xs"
                  : "text-[#6c8678] hover:bg-[#f4f8f3]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Date Range Picker if Custom */}
      {period === "custom" && (
        <div className="p-4 rounded-2xl bg-white border border-[#dce7dc] shadow-xs flex flex-wrap gap-4 items-center animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#506c5e]">ตั้งแต่วันที่:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#dce7dc] bg-[#f8faf7] text-xs font-medium text-[#23382f]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#506c5e]">ถึงวันที่:</span>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#dce7dc] bg-[#f8faf7] text-xs font-medium text-[#23382f]"
            />
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {query.isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-xs text-[#71877c] gap-2">
          <LoaderCircle size={24} className="animate-spin text-[#438765]" />
          <span>กำลังประมวลผลรายงานการเงิน...</span>
        </div>
      ) : query.isError ? (
        <div className="p-4 rounded-2xl bg-[#fff0f2] border border-[#fbdbe1] text-xs text-[#bd4754]" role="alert">
          {(query.error as Error).message}
        </div>
      ) : summary.count === 0 ? (
        /* Empty State with empty-reports.png */
        <div className="bg-white rounded-3xl p-10 border border-[#e2ece0] shadow-[0_8px_30px_rgba(42,78,56,0.04)] flex flex-col items-center justify-center text-center">
          <div className="w-44 h-44 mb-3">
            <img
              src="/images/empty-states/empty-reports.png"
              alt="No report data"
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>
          <strong className="text-base font-bold text-[#23382e]">ยังไม่มีข้อมูลในช่วงเวลานี้</strong>
          <p className="text-xs text-[#71877c] max-w-sm mt-1">
            เมื่อคุณบันทึกรายรับหรือรายจ่าย ข้อมูลจะถูกนำมาสรุปและแสดงแผนภูมิแนวโน้มที่นี่โดยอัตโนมัติ
          </p>
        </div>
      ) : (
        <>
          {/* ================= NET BALANCE & COMPARISON ================= */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Balance Card with Sleeping Pig on Cloud */}
            <div className="relative bg-gradient-to-br from-[#ebf5ee] via-[#f7faf5] to-white rounded-3xl p-6 border border-[#d2ead6] shadow-[0_8px_24px_rgba(42,78,56,0.05)] flex flex-col justify-between group transition-shadow hover:shadow-md overflow-visible">
              <CardGinghamOverlay opacity="opacity-[0.02]" />

              {/* Fluffy Cloud Shelf anchoring the Sleeping Pig */}
              <div className="absolute -top-2 right-4 w-28 h-4 rounded-full bg-white/90 border border-[#d5eadc] shadow-xs pointer-events-none z-10" />

              {/* Sleeping Pig on Cloud */}
              <div className="absolute -top-10 right-2 w-24 h-24 pointer-events-none filter drop-shadow-[0_8px_18px_rgba(30,65,40,0.14)] z-20 transition-transform group-hover:scale-105 group-hover:-translate-y-1">
                <img src="/images/mascots/pig-mascot-sleeping.png" alt="" className="w-full h-full object-contain" />
              </div>

              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#48725b] mb-2">
                  <Wallet size={15} /> เงินสุทธิในช่วงเวลานี้
                </span>
                <strong className="block text-2xl sm:text-3xl font-extrabold text-[#1f3a2d] tabular-nums mt-1">
                  {money(summary.balance)}
                </strong>
                <span className="block text-[11px] text-[#718a7c] mt-1">{summary.count} รายการที่เกิดขึ้น</span>
              </div>
            </div>

            {/* Total Income Card */}
            <div className="relative bg-gradient-to-b from-[#f3faf5] via-white to-[#fafdfb] rounded-3xl p-6 border border-[#cce7d3] shadow-[0_8px_24px_rgba(42,78,56,0.04)] flex flex-col justify-between overflow-hidden">
              <CardGinghamOverlay opacity="opacity-[0.02]" />
              <div className="relative z-10">
                <span className="w-9 h-9 rounded-2xl bg-[#e6f7ef] text-[#229667] flex items-center justify-center mb-3 shadow-xs">
                  <ArrowDownLeft size={18} strokeWidth={2.5} />
                </span>
                <span className="block text-xs font-semibold text-[#6d8576]">รายรับทั้งหมด</span>
                <strong className="block text-xl sm:text-2xl font-extrabold text-[#239667] tabular-nums mt-1 truncate">
                  {money(summary.income)}
                </strong>
              </div>
              <span className="relative z-10 text-[10px] text-[#8fa597] mt-3">กระแสเงินสดขาเข้า</span>
            </div>

            {/* Total Expense Card */}
            <div className="relative bg-gradient-to-b from-[#fef5f6] via-white to-[#fcf8f9] rounded-3xl p-6 border border-[#fbdae0] shadow-[0_8px_24px_rgba(42,78,56,0.04)] flex flex-col justify-between overflow-hidden">
              <CardGinghamOverlay opacity="opacity-[0.02]" />
              <div className="relative z-10">
                <span className="w-9 h-9 rounded-2xl bg-[#fff0f2] text-[#dd5e6d] flex items-center justify-center mb-3 shadow-xs">
                  <ArrowUpRight size={18} strokeWidth={2.5} />
                </span>
                <span className="block text-xs font-semibold text-[#6d8576]">รายจ่ายทั้งหมด</span>
                <strong className="block text-xl sm:text-2xl font-extrabold text-[#dd5e6d] tabular-nums mt-1 truncate">
                  {money(summary.expense)}
                </strong>
              </div>
              <span className="relative z-10 text-[10px] text-[#8fa597] mt-3">กระแสเงินสดขาออก</span>
            </div>
          </section>

          {/* ================= DAILY TREND BAR CHART ================= */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e2ece0] shadow-[0_8px_30px_rgba(42,78,56,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#438765]" />
                  <h2 className="text-base font-bold text-[#23382e]">แนวโน้มรายรับและรายจ่ายรายวัน</h2>
                </div>
                <p className="text-xs text-[#71877c] mt-0.5">
                  เปรียบเทียบระหว่างรายรับและรายจ่ายในแต่ละวัน
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-[#668072]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#239667]" />
                  <span>รายรับ</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#dd5e6d]" />
                  <span>รายจ่าย</span>
                </span>
              </div>
            </div>

            {/* Bar Chart Container */}
            <div className="h-[200px] flex items-end gap-2 overflow-x-auto pb-2 pt-4 border-b border-[#edf3ec]">
              {summary.byDay.slice(-31).map((day) => {
                const incHeight = maxDaily > 0 ? (day.income / maxDaily) * 100 : 0;
                const expHeight = maxDaily > 0 ? (day.expense / maxDaily) * 100 : 0;

                return (
                  <div
                    key={day.date}
                    className="flex-1 min-w-[28px] h-full flex flex-col justify-end items-center gap-1.5 group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-[#1e382b] text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                      <span>{day.date}</span>
                      <span>
                        รับ: {money(day.income)} | จ่าย: {money(day.expense)}
                      </span>
                    </div>

                    {/* Bars */}
                    <div className="w-full flex items-end justify-center gap-1 h-[160px]">
                      <div
                        className="w-2.5 rounded-t-sm bg-[#239667] transition-all duration-300"
                        style={{ height: `${Math.max(day.income > 0 ? 4 : 0, incHeight)}%` }}
                      />
                      <div
                        className="w-2.5 rounded-t-sm bg-[#dd5e6d] transition-all duration-300"
                        style={{ height: `${Math.max(day.expense > 0 ? 4 : 0, expHeight)}%` }}
                      />
                    </div>

                    <span className="text-[9px] text-[#8fa597] font-medium leading-none">
                      {day.date.slice(8)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================= CATEGORY BREAKDOWN ================= */}
          <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e2ece0] shadow-[0_8px_30px_rgba(42,78,56,0.04)]">
            <div className="flex items-center gap-2 mb-5">
              <PieChart size={18} className="text-[#438765]" />
              <h2 className="text-base font-bold text-[#23382e]">สัดส่วนรายจ่ายตามหมวดหมู่</h2>
            </div>

            {expenseCategories.length === 0 ? (
              <p className="text-xs text-[#71877c] py-4 text-center">ไม่มีรายจ่ายในช่วงเวลานี้</p>
            ) : (
              <div className="space-y-4">
                {expenseCategories.map((item, idx) => {
                  const percent = summary.expense > 0 ? (item.amount / summary.expense) * 100 : 0;
                  const colors = ["#e06272", "#419973", "#df842d", "#7c60d9", "#3b8fc7", "#d6538b"];
                  const barColor = colors[idx % colors.length];

                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#23382e]">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#71877c] tabular-nums">{percent.toFixed(1)}%</span>
                          <span className="text-[#23382e] font-bold tabular-nums">{money(item.amount)}</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full bg-[#edf4ec] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
