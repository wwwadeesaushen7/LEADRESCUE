import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allowedOrigins, appOrigin } from "@/lib/app-origin";
import { trustedOrigin } from "@/lib/http";
const request = (origin: string, host = "untrusted.example") =>
  new Request("https://internal.example/api/demo", {
    method: "POST",
    headers: { origin, host },
  });
beforeEach(() => {
  vi.stubEnv("APP_URL", "");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("VERCEL_ENV", "");
  vi.stubEnv("VERCEL_URL", "");
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
  vi.stubEnv("NODE_ENV", "production");
});
afterEach(() => vi.unstubAllEnvs());
describe("Trusted deployment addresses", () => {
  it("allows Vercel deployment and production aliases without manual settings", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "leadrescue-build123.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "leadrescue.vercel.app");
    for (const origin of [
      "https://leadrescue.vercel.app",
      "https://leadrescue-build123.vercel.app",
    ]) {
      expect(trustedOrigin(request(origin))).toBe(true);
      expect(appOrigin(request(origin))).toBe(origin);
    }
    expect(trustedOrigin(request("https://someone-else.vercel.app"))).toBe(
      false,
    );
  });
  it("does not let preview deployments accept the production site origin", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "leadrescue-preview.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "leadrescue.vercel.app");
    expect(
      trustedOrigin(request("https://leadrescue-preview.vercel.app")),
    ).toBe(true);
    expect(trustedOrigin(request("https://leadrescue.vercel.app"))).toBe(false);
  });
  it("honors the explicit app address exclusively", () => {
    vi.stubEnv("APP_URL", "https://app.example.com");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_URL", "other.vercel.app");
    expect(trustedOrigin(request("https://app.example.com"))).toBe(true);
    expect(trustedOrigin(request("https://other.vercel.app"))).toBe(false);
  });
  it("cannot be configured by forged Host or Origin headers in production", () => {
    expect(
      allowedOrigins(request("https://attacker.example", "attacker.example")),
    ).toEqual([]);
    expect(appOrigin(request("https://attacker.example"))).toBe(null);
  });
  it.each([
    "not-a-url",
    "https://example.com/path",
    "https://user:password@example.com",
    "javascript:alert(1)",
  ])("rejects invalid explicit configuration %s", (value) => {
    vi.stubEnv("APP_URL", value);
    expect(trustedOrigin(request("https://example.com"))).toBe(false);
  });
  it("rejects malformed platform hostnames", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_URL", "good.vercel.app@attacker.example");
    expect(allowedOrigins(request("https://attacker.example"))).toEqual([]);
  });
  it("supports local development without configuration", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(
      trustedOrigin(request("http://localhost:3000", "localhost:3000")),
    ).toBe(true);
    expect(
      trustedOrigin(request("https://attacker.example", "localhost:3000")),
    ).toBe(false);
  });
});
