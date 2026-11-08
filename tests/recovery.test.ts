import { describe, it, expect } from "vitest";
import {
  evaluateRecovery,
  channelEligibility,
  isOptOut,
  whatsappWindowOpen,
  noConsent,
  type CallOutcome,
} from "@/lib/recovery/policy";
import { defaultSettings } from "@/lib/simulation/model";
const now = "2026-11-08T12:00:00.000Z",
  allowed = { ...noConsent, whatsapp: true, sms: true };
describe("Recovery eligibility policy", () => {
  it("selects just WhatsApp when both channels are independently eligible", () => {
    expect(
      evaluateRecovery("no-answer", defaultSettings, allowed, now),
    ).toMatchObject({ kind: "send", channel: "WhatsApp", format: "template" });
  });
  it("allows SMS fallback only when it has its own permission, sender and registration", () => {
    const s = { ...defaultSettings, whatsappReady: false };
    expect(evaluateRecovery("busy", s, allowed, now)).toMatchObject({
      kind: "send",
      channel: "SMS",
    });
    for (const override of [{ sms: false }])
      expect(
        evaluateRecovery("busy", s, { ...allowed, ...override }, now).kind,
      ).toBe("manual");
    for (const override of [{ smsReady: false }, { smsRegistered: false }])
      expect(
        evaluateRecovery("busy", { ...s, ...override }, allowed, now).kind,
      ).toBe("manual");
  });
  it("never treats a missed call or inbound service window as consent", () => {
    expect(
      evaluateRecovery("failed", defaultSettings, noConsent, now).kind,
    ).toBe("manual");
    expect(
      evaluateRecovery(
        "no-answer",
        defaultSettings,
        { ...noConsent, lastInboundWhatsAppAt: now },
        now,
      ).kind,
    ).toBe("manual");
  });
  it.each(["both", "whatsapp", "sms"] as const)(
    "opt-out overrides ready senders and both permissions in %s mode",
    (mode) => {
      expect(
        evaluateRecovery(
          "no-answer",
          { ...defaultSettings, mode },
          { ...allowed, optedOut: true },
          now,
        ),
      ).toMatchObject({
        kind: "manual",
        reason: expect.stringContaining("opted out"),
      });
    },
  );
  it("honors single-channel modes instead of silently choosing the other channel", () => {
    expect(
      evaluateRecovery(
        "no-answer",
        { ...defaultSettings, mode: "whatsapp", whatsappReady: false },
        allowed,
        now,
      ).kind,
    ).toBe("manual");
    expect(
      evaluateRecovery(
        "no-answer",
        { ...defaultSettings, mode: "sms" },
        allowed,
        now,
      ),
    ).toMatchObject({ channel: "SMS" });
  });
  it("requires a template outside the exact 24-hour WhatsApp window", () => {
    const s = {
      ...defaultSettings,
      mode: "whatsapp" as const,
      approvedTemplate: false,
    };
    const consent = {
      ...allowed,
      lastInboundWhatsAppAt: "2026-11-07T12:00:00.001Z",
    };
    expect(evaluateRecovery("no-answer", s, consent, now)).toMatchObject({
      format: "freeform",
    });
    consent.lastInboundWhatsAppAt = "2026-11-07T12:00:00.000Z";
    expect(whatsappWindowOpen(consent, now)).toBe(false);
    expect(evaluateRecovery("no-answer", s, consent, now).kind).toBe("manual");
    expect(
      evaluateRecovery(
        "no-answer",
        { ...s, approvedTemplate: true },
        consent,
        now,
      ),
    ).toMatchObject({ format: "template" });
    expect(
      whatsappWindowOpen(
        { ...consent, lastInboundWhatsAppAt: "2026-11-09T00:00:00Z" },
        now,
      ),
    ).toBe(false);
  });
  it.each(["answered", "canceled", "ringing"] as CallOutcome[])(
    "does not recover a %s call",
    (outcome) => {
      expect(
        evaluateRecovery(outcome, defaultSettings, allowed, now).kind,
      ).toBe("skip");
    },
  );
  it("distinguishes screened voicemail from a provider answer", () => {
    expect(
      evaluateRecovery("voicemail", defaultSettings, allowed, now).kind,
    ).toBe("skip");
    expect(
      evaluateRecovery(
        "voicemail",
        { ...defaultSettings, screenVoicemail: true },
        allowed,
        now,
      ).kind,
    ).toBe("send");
    expect(
      evaluateRecovery(
        "no-answer",
        { ...defaultSettings, enabled: false },
        allowed,
        now,
      ).kind,
    ).toBe("skip");
  });
  it("recognizes opt-out keywords as complete inbound messages only", () => {
    for (const text of [
      "STOP",
      " stop ",
      "UNSUBSCRIBE",
      "Cancel",
      "END",
      "Quit",
      "REVOKE",
      "OPT OUT",
      "STOPALL",
    ])
      expect(isOptOut(text)).toBe(true);
    expect(isOptOut("Please stop by tomorrow")).toBe(false);
    expect(
      channelEligibility(
        "SMS",
        defaultSettings,
        { ...allowed, optedOut: true },
        now,
      ).kind,
    ).toBe("manual");
  });
});
