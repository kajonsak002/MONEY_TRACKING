import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { canvas: "var(--color-canvas)", surface: "var(--color-surface)", ink: "var(--color-ink)", brand: "var(--color-brand)", income: "var(--color-income)", expense: "var(--color-expense)" }, borderRadius: { card: "var(--radius-card)" } } },
  plugins: [],
} satisfies Config;