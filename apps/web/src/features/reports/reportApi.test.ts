import { describe, expect, it } from "vitest";
import { summarizeEntries } from "./reportApi";
import type { EntryRecord } from "../entries/entriesApi";

const entry = (id: string, type: "income" | "expense", amount_satang: number, occurred_on: string, categoryName: string | null = null): EntryRecord => ({
  id, type, amount_satang, occurred_on, note: null, category_id: null,
  categories: categoryName ? { id: `cat-${categoryName}`, name: categoryName, type, icon: "tag", color: "brand" } : null,
});

describe("summarizeEntries", () => {
  it("calculates income, expense and net balance in satang", () => {
    const result = summarizeEntries([
      entry("1", "income", 250000, "2026-10-01"),
      entry("2", "expense", 35000, "2026-10-01"),
      entry("3", "expense", 15000, "2026-10-02"),
    ]);
    expect(result.income).toBe(250000);
    expect(result.expense).toBe(50000);
    expect(result.balance).toBe(200000);
    expect(result.count).toBe(3);
  });

  it("groups daily totals and category amounts", () => {
    const result = summarizeEntries([
      entry("1", "expense", 10000, "2026-10-02", "อาหาร"),
      entry("2", "expense", 20000, "2026-10-02", "อาหาร"),
      entry("3", "income", 50000, "2026-10-03", "เงินเดือน"),
    ]);
    expect(result.byDay).toEqual([
      { date: "2026-10-02", income: 0, expense: 30000 },
      { date: "2026-10-03", income: 50000, expense: 0 },
    ]);
    expect(result.byCategory).toEqual([
      { name: "อาหาร", amount: 30000, type: "expense" },
      { name: "เงินเดือน", amount: 50000, type: "income" },
    ]);
  });

  it("places uncategorized entries in a fallback category", () => {
    const result = summarizeEntries([entry("1", "expense", 125, "2026-10-01")]);
    expect(result.byCategory[0]).toEqual({ name: "ไม่ระบุหมวดหมู่", amount: 125, type: "expense" });
  });
});
