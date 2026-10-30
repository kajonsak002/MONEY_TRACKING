export const colorTokens = {
  brand: "var(--color-brand)",
  income: "var(--color-income)",
  expense: "var(--color-expense)",
  canvas: "var(--color-canvas)",
  surface: "var(--color-surface)",
  ink: "var(--color-ink)",
  muted: "var(--color-muted)",
} as const;

export const spacingTokens = {
  1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px", 6: "24px", 8: "32px",
} as const;

export const radiusTokens = {
  control: "var(--radius-control)",
  card: "var(--radius-card)",
} as const;

export const designTokens = { color: colorTokens, spacing: spacingTokens, radius: radiusTokens } as const;
