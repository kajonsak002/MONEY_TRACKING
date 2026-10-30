interface AmountTextProps {
  amountSatang: number;
  type?: "income" | "expense" | "neutral";
  showSign?: boolean;
}

export function AmountText({ amountSatang, type = "neutral", showSign = false }: AmountTextProps) {
  const amount = Math.abs(amountSatang) / 100;
  const formatted = new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  const sign = showSign && type !== "neutral" ? (type === "income" ? "+" : "−") : "";
  return <span className={`amount-text amount-text--${type}`}>฿{sign}{formatted}</span>;
}
