import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  configured: true,
  auth: {
    getUser: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
  },
  rpc: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  isSupabaseConfigured: () => mocks.configured,
  supabaseServer: async () => ({ auth: mocks.auth, rpc: mocks.rpc }),
}));
import { POST } from "@/app/api/auth/[action]/route";
import { POST as createBusiness } from "@/app/api/business/route";
const req = (body: object, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const call = (action: string, body: object) =>
  POST(req(body), { params: Promise.resolve({ action }) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.configured = true;
  process.env.APP_URL = "http://localhost:3000";
});
describe("Server authorization (mock Supabase adapter)", () => {
  it("rejects cross-origin requests before auth", async () => {
    expect(
      (
        await POST(req({}, "https://attacker.test"), {
          params: Promise.resolve({ action: "login" }),
        })
      ).status,
    ).toBe(403);
    expect(mocks.auth.signInWithPassword).not.toHaveBeenCalled();
  });
  it("fails closed when Supabase is absent", async () => {
    mocks.configured = false;
    expect((await call("login", {})).status).toBe(503);
  });
  it("does not expose provider errors on login failure", async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "sensitive provider details" },
    });
    const r = await call("login", {
      email: "owner@example.com",
      password: "password",
    });
    expect(r.status).toBe(401);
    expect(JSON.stringify(await r.json())).not.toContain("sensitive");
  });
  it("blocks unverified accounts even if the provider grants a session", async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user" }, session: {} },
      error: null,
    });
    expect(
      (
        await call("login", {
          email: "owner@example.com",
          password: "password",
        })
      ).status,
    ).toBe(401);
    expect(mocks.auth.signOut).toHaveBeenCalled();
  });
  it("accepts a verified login", async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user", email_confirmed_at: "2026-01-01" } },
      error: null,
    });
    expect(
      await (
        await call("login", {
          email: "owner@example.com",
          password: "password",
        })
      ).json(),
    ).toEqual({ redirect: "/dashboard" });
  });
  it("requires a real authenticated user for password updates", async () => {
    mocks.auth.getUser.mockResolvedValue({ data: { user: null } });
    expect(
      (await call("reset-password", { password: "a-long-enough-password" }))
        .status,
    ).toBe(401);
    expect(mocks.auth.updateUser).not.toHaveBeenCalled();
  });
  it("requires authentication before business creation", async () => {
    mocks.auth.getUser.mockResolvedValue({ data: { user: null } });
    expect((await createBusiness(req({}))).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("returns a verification instruction after signup", async () => {
    mocks.auth.signUp.mockResolvedValue({ error: null });
    const r = await call("signup", {
      email: "owner@example.com",
      password: "a-long-enough-password",
    });
    expect(r.status).toBe(200);
    expect((await r.json()).message).toContain("verify");
    expect(mocks.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { emailRedirectTo: "http://localhost:3000/auth/callback" },
      }),
    );
  });
  it("reports recovery delivery service errors", async () => {
    mocks.auth.resetPasswordForEmail.mockResolvedValue({
      error: { message: "rate limited" },
    });
    expect(
      (await call("forgot-password", { email: "owner@example.com" })).status,
    ).toBe(503);
  });
});
