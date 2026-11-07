import { describe, expect, it } from "vitest";
import { businessSchema, credentialsSchema, safeNext } from "@/lib/validation";
export const business = {
  name: "Test Plumbing",
  industry: "Plumbing",
  phone: "+14155550100",
  email: "owner@example.com",
  location: "Austin, TX",
  timezone: "America/Chicago",
  opens: "09:00",
  closes: "17:00",
  workingDays: [1, 2, 3, 4, 5],
  description: "",
  website: "",
};
describe("Business input and authentication validation", () => {
  it("accepts a complete business with working hours", () =>
    expect(businessSchema.parse(business).name).toBe("Test Plumbing"));
  it.each([
    { phone: "555" },
    { timezone: "Fake/Zone" },
    { website: "javascript:alert(1)" },
    { workingDays: [] },
    { workingDays: [1, 1] },
    { opens: "18:00", closes: "08:00" },
    { name: "X" },
  ])("rejects invalid business input %j", (change) =>
    expect(businessSchema.safeParse({ ...business, ...change }).success).toBe(
      false,
    ),
  );
  it("requires a long password and a valid email", () => {
    expect(
      credentialsSchema.safeParse({
        email: "owner@example.com",
        password: "short",
      }).success,
    ).toBe(false);
    expect(
      credentialsSchema.safeParse({
        email: "invalid",
        password: "this-is-long-enough",
      }).success,
    ).toBe(false);
  });
  it("allows only fixed callback destinations", () => {
    expect(safeNext("/reset-password")).toBe("/reset-password");
    for (const url of [
      "https://attacker.test",
      "//attacker.test",
      "/admin",
      null,
    ])
      expect(safeNext(url)).toBe("/dashboard");
  });
});
