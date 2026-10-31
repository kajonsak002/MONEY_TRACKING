import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        brand: {
          DEFAULT: "var(--color-brand)",
          deep: "var(--color-brand-deep)",
          soft: "var(--color-brand-soft)",
          sidebar: "var(--color-brand-sidebar)",
        },
        income: {
          DEFAULT: "var(--color-income)",
          soft: "var(--color-income-soft)",
        },
        expense: {
          DEFAULT: "var(--color-expense)",
          soft: "var(--color-expense-soft)",
        },
        pig: {
          DEFAULT: "#fbaab7",
          soft: "#fdf0f2",
        },
        frog: {
          DEFAULT: "#76b88e",
          soft: "#eaf5ee",
        },
        pastel: {
          green: "#85c49f",
          pink: "#fbb0be",
          cream: "#fef6e9",
          yellow: "#fcd34d",
          blue: "#9ecbf8",
          purple: "#c4b5fd",
        },
      },
      borderRadius: {
        card: "var(--radius-card)",
        control: "var(--radius-control)",
        "3xl": "28px",
        "4xl": "36px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        soft: "0 8px 30px rgba(45, 80, 58, 0.05)",
        floating: "0 18px 45px rgba(35, 65, 45, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
