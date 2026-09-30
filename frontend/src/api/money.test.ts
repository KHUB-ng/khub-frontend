import { describe, expect, it } from "vitest";
import { isValidNaira, koboToNaira, toNairaString, toWholeNaira } from "./money";

describe("money — outbound naira strings", () => {
  it("normalises plain input to two decimals", () => {
    expect(toNairaString("1500")).toBe("1500.00");
    expect(toNairaString("1500.5")).toBe("1500.50");
    expect(toNairaString(20)).toBe("20.00");
  });

  it("strips separators and the naira symbol", () => {
    expect(toNairaString("₦1,500.05")).toBe("1500.05");
    expect(toNairaString("1 500")).toBe("1500.00");
  });

  it("rejects non-positive and malformed amounts", () => {
    expect(toNairaString("0")).toBeNull();
    expect(toNairaString("-5")).toBeNull();
    expect(toNairaString("abc")).toBeNull();
    expect(toNairaString("12.345")).toBeNull();
    expect(toNairaString("")).toBeNull();
  });

  it("isValidNaira mirrors toNairaString", () => {
    expect(isValidNaira("99.99")).toBe(true);
    expect(isValidNaira("9.999")).toBe(false);
  });

  it("withdrawals accept whole naira only", () => {
    expect(toWholeNaira("5000")).toBe("5000");
    expect(toWholeNaira("5000.50")).toBeNull();
    expect(toWholeNaira("0")).toBeNull();
  });
});

describe("money — inbound kobo rendering", () => {
  it("renders kobo as naira", () => {
    expect(koboToNaira(150005)).toContain("1,500.05");
    expect(koboToNaira(0)).toContain("0.00");
  });
});
