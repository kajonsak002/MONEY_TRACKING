import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "../auth/AuthProvider";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("shows the dashboard and a clear connection state when Supabase is unavailable", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<AuthProvider><QueryClientProvider client={queryClient}><MemoryRouter><HomePage /></MemoryRouter></QueryClientProvider></AuthProvider>);
    expect(screen.getByRole("heading", { name: /สวัสดี, สมาชิก/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "บันทึกรายการง่าย ๆ" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("ยังไม่ได้ตั้งค่า Supabase");
    expect(screen.getByText("เชื่อมต่อฐานข้อมูลก่อนเพื่อดูรายการล่าสุด")).toBeInTheDocument();
  });
});
