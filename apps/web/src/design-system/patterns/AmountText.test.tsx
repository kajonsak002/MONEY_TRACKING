import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AmountText } from "./AmountText";

describe("AmountText", () => {
  it("formats integer satang as Thai baht with two decimals", () => {
    render(<AmountText amountSatang={12345} type="income" showSign />);
    expect(screen.getByText(/฿\+123\.45/)).toBeInTheDocument();
  });
});
