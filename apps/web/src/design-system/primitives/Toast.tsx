import type { ReactNode } from "react";

interface ToastProps {
  children: ReactNode;
  tone?: "success" | "error" | "info";
}

export function Toast({ children, tone = "info" }: ToastProps) {
  return <div className={`ui-toast ui-toast--${tone}`} role="status" aria-live="polite">{children}</div>;
}
