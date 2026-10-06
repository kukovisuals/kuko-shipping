import { describe, expect, it } from "vitest";
import { can, isRole } from "./roles";

describe("can", () => {
  it("lets a viewer read only", () => {
    expect(can("viewer", "read")).toBe(true);
    expect(can("viewer", "write")).toBe(false);
    expect(can("viewer", "admin")).toBe(false);
  });

  it("lets staff read and write but not administer", () => {
    expect(can("staff", "read")).toBe(true);
    expect(can("staff", "write")).toBe(true);
    expect(can("staff", "admin")).toBe(false);
  });

  it("lets the owner do everything", () => {
    expect(can("owner", "read")).toBe(true);
    expect(can("owner", "write")).toBe(true);
    expect(can("owner", "admin")).toBe(true);
  });
});

describe("isRole", () => {
  it("accepts only the three roles", () => {
    expect(isRole("staff")).toBe(true);
    expect(isRole("admin")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});
