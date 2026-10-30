import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "../auth/AuthProvider";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("shows the dashboard sections and empty state", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<AuthProvider><QueryClientProvider client={queryClient}><MemoryRouter><HomePage /></MemoryRouter></QueryClientProvider></AuthProvider>);
    expect(screen.getByRole("heading", { name: "สวัสดีครับ" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "เพิ่มรายการเร็ว" })).toBeInTheDocument();
    expect(screen.getByText("ยังไม่มีรายการ")).toBeInTheDocument();
  });
});
