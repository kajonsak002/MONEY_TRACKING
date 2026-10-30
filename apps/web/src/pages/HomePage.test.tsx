import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("shows the dashboard sections and empty state", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "สวัสดีครับ" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "เพิ่มรายการเร็ว" })).toBeInTheDocument();
    expect(screen.getByText("ยังไม่มีรายการ")).toBeInTheDocument();
  });
});
