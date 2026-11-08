import { describe, it, expect } from "vitest";
import { sampleBusiness } from "@/lib/demo/session-data";
import { applyDemoCommand, seedWorkspace } from "@/lib/workspace/demo";
import { csvCell, leadsCsv } from "@/lib/workspace/csv";
import { localDateTime, zonedToUtc } from "@/lib/workspace/time";
import { summary } from "@/lib/workspace/model";
describe("Business tools", () => {
  it("converts international wall-clock times without depending on the browser timezone", () => {
    expect(zonedToUtc("2026-11-10T09:00", "Asia/Colombo")).toBe(
      "2026-11-10T03:30:00.000Z",
    );
    expect(zonedToUtc("2026-11-10T09:00", "America/New_York")).toBe(
      "2026-11-10T14:00:00.000Z",
    );
    expect(zonedToUtc("2026-07-10T09:00", "America/New_York")).toBe(
      "2026-07-10T13:00:00.000Z",
    );
    expect(localDateTime("2026-12-31T23:30:00Z", "Asia/Tokyo")).toBe(
      "2027-01-01T08:30",
    );
  });
  it("rejects missing, repeated and invalid dates rather than silently changing bookings", () => {
    expect(() => zonedToUtc("2026-03-08T02:30", "America/New_York")).toThrow(
      "does not exist",
    );
    expect(() => zonedToUtc("2026-11-01T01:30", "America/New_York")).toThrow(
      "occurs twice",
    );
    expect(() => zonedToUtc("2026-02-30T10:00", "UTC")).toThrow();
  });
  it("escapes CSV quotes and neutralizes spreadsheet formulas, including phone numbers", () => {
    expect(csvCell("=SUM(1,2)")).toBe('"\'=SUM(1,2)"');
    expect(csvCell("  @SUM(1,2)")).toBe('"\'  @SUM(1,2)"');
    expect(csvCell('Say "hi"\nagain')).toBe('"Say ""hi""\nagain"');
    expect(leadsCsv(seedWorkspace(sampleBusiness).leads)).toContain(
      '"\'+12025550101"',
    );
  });
  it("adds and edits leads without mutating the previous snapshot and updates dashboard counts", () => {
    const data = seedWorkspace(sampleBusiness),
      lead = {
        name: "New Customer",
        phone: "+14155550999",
        email: "",
        notes: "Repair",
        source: "Manual" as const,
        status: "Won" as const,
      };
    const next = applyDemoCommand(data, { action: "saveLead", data: lead });
    expect(data.leads).toHaveLength(4);
    expect(summary(next)).toMatchObject({ leads: 5, won: 1 });
    expect(() =>
      applyDemoCommand(next, { action: "saveLead", data: lead }),
    ).toThrow("already exists");
    const edited = applyDemoCommand(next, {
      action: "saveLead",
      id: next.leads[0].id,
      data: { ...lead, status: "Lost" },
    });
    expect(summary(edited).won).toBe(0);
  });
  it("preserves conversation isolation and simulates inbound replies explicitly", () => {
    const data = seedWorkspace(sampleBusiness),
      c = data.conversations[0];
    const next = applyDemoCommand(data, {
      action: "simulateReply",
      data: { conversation_id: c.id, body: "Hello" },
    });
    expect(next.messages.at(-1)).toMatchObject({
      conversation_id: c.id,
      direction: "inbound",
      status: "simulated",
    });
    expect(next.notifications[0].title).toContain("Simulated");
    expect(() =>
      applyDemoCommand(data, {
        action: "saveMessage",
        data: { conversation_id: crypto.randomUUID(), body: "Hello" },
      }),
    ).toThrow("not found");
  });
  it("rejects overlapping appointments and allows adjacent ones in the demo", () => {
    const data = seedWorkspace(sampleBusiness),
      a = data.appointments[0];
    expect(() =>
      applyDemoCommand(data, { action: "saveAppointment", data: a }),
    ).toThrow("overlaps");
    const next = applyDemoCommand(data, {
      action: "saveAppointment",
      data: {
        ...a,
        starts_at: a.ends_at,
        ends_at: new Date(
          new Date(a.ends_at).getTime() + 3600000,
        ).toISOString(),
      },
    });
    expect(next.appointments).toHaveLength(2);
  });
});
