import { beforeEach, describe, it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({
  configured: true,
  user: { email_confirmed_at: "2026-01-01" } as {
    email_confirmed_at: string;
  } | null,
  business: { id: "10000000-0000-4000-8000-000000000001" },
  from: vi.fn(),
  rpc: vi.fn(),
  load: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  isSupabaseConfigured: () => mock.configured,
  supabaseServer: async () => ({
    auth: { getUser: async () => ({ data: { user: mock.user } }) },
    from: mock.from,
    rpc: mock.rpc,
  }),
}));
vi.mock("@/lib/workspace/server", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/workspace/server")>();
  return {
    ...original,
    currentBusiness: async () => mock.business,
    loadWorkspace: mock.load,
  };
});
import { GET, POST } from "@/app/api/workspace/route";
const request = (body: object, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/workspace", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const lead = {
  name: "Customer One",
  phone: "+14155550100",
  email: "",
  source: "Manual",
  status: "New",
  notes: "",
};
beforeEach(() => {
  vi.resetAllMocks();
  mock.configured = true;
  mock.user = { email_confirmed_at: "2026-01-01" };
  mock.load.mockResolvedValue({ leads: [] });
  mock.rpc.mockResolvedValue({ error: null });
  process.env.APP_URL = "http://localhost:3000";
});
describe("Workspace API authorization and boundaries", () => {
  it("rejects forged origins and requires verified auth", async () => {
    expect((await POST(request({}, "https://attacker.example"))).status).toBe(
      403,
    );
    mock.user = null;
    expect(
      (await GET(new Request("http://localhost:3000/api/workspace"))).status,
    ).toBe(401);
    mock.user = { email_confirmed_at: "" };
    expect(
      (await POST(request({ action: "saveLead", data: lead }))).status,
    ).toBe(401);
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("binds inserted lead records to the authenticated business and strips spoofed fields", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mock.from.mockReturnValue({ insert });
    const response = await POST(
      request({
        action: "saveLead",
        data: { ...lead, business_id: "attacker", id: "spoofed" },
      }),
    );
    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith({
      ...lead,
      business_id: mock.business.id,
    });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("scopes updates by both record and business and never permits simulated live replies", async () => {
    const builder = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({ error: null }),
    };
    builder.update.mockReturnValue(builder);
    builder.eq.mockReturnValue(builder);
    builder.select.mockReturnValue(builder);
    mock.from.mockReturnValue(builder);
    const id = crypto.randomUUID();
    expect(
      (await POST(request({ action: "saveLead", id, data: lead }))).status,
    ).toBe(200);
    expect(builder.eq).toHaveBeenCalledWith("id", id);
    expect(builder.eq).toHaveBeenCalledWith("business_id", mock.business.id);
    expect(
      (
        await POST(
          request({
            action: "simulateReply",
            data: { conversation_id: id, body: "Hello" },
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("rejects every simulator command before any database write", async () => {
    for (const type of [
      "prepare",
      "start",
      "finish",
      "delivery",
      "reply",
      "permissions",
      "settings",
      "book",
      "won",
      "advance",
      "process",
      "select",
    ]) {
      expect(
        (await POST(request({ action: "simulation", data: { type } }))).status,
      ).toBe(400);
    }
    expect(mock.from).not.toHaveBeenCalled();
    expect(mock.rpc).not.toHaveBeenCalled();
    expect(mock.load).not.toHaveBeenCalled();
  });
  it("forces live messages to unsent drafts and rejects invalid data before writes", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mock.from.mockReturnValue({ insert });
    const conversation_id = crypto.randomUUID();
    expect(
      (
        await POST(
          request({
            action: "saveMessage",
            data: {
              conversation_id,
              body: "Hello",
              status: "delivered",
              direction: "inbound",
            },
          }),
        )
      ).status,
    ).toBe(200);
    expect(insert).toHaveBeenCalledWith({
      business_id: mock.business.id,
      conversation_id,
      body: "Hello",
      status: "draft",
      direction: "outbound",
    });
    mock.from.mockClear();
    expect(
      (
        await POST(
          request({ action: "saveLead", data: { ...lead, phone: "invalid" } }),
        )
      ).status,
    ).toBe(400);
    expect(mock.from).not.toHaveBeenCalled();
  });
  it("explains a missing migration without exposing provider errors", async () => {
    mock.load.mockRejectedValue({
      code: "PGRST205",
      message: "internal schema details",
    });
    const response = await GET(
      new Request("http://localhost:3000/api/workspace"),
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "One database update is needed to enable these features.",
      code: "SETUP_REQUIRED",
    });
  });
  it("reports collisions and missing records instead of claiming an update succeeded", async () => {
    mock.from.mockReturnValue({
      insert: async () => ({ error: { code: "23P01" } }),
    });
    const data = {
      lead_id: crypto.randomUUID(),
      title: "Repair visit",
      starts_at: "2026-12-01T10:00:00Z",
      ends_at: "2026-12-01T11:00:00Z",
      status: "Scheduled",
      notes: "",
    };
    expect(
      (await POST(request({ action: "saveAppointment", data }))).status,
    ).toBe(409);
    expect(mock.load).not.toHaveBeenCalled();
  });
});
