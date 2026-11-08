// Pure policy shared by the simulator and future server-side provider adapters.
// A caller's telephone call is never treated as messaging consent.
export type Channel = "WhatsApp" | "SMS";
export type CallOutcome =
  | "ringing"
  | "answered"
  | "no-answer"
  | "busy"
  | "failed"
  | "canceled"
  | "voicemail";
export type Consent = {
  whatsapp: boolean;
  sms: boolean;
  optedOut: boolean;
  lastInboundWhatsAppAt: string | null;
};
export type RecoverySettings = {
  enabled: boolean;
  mode: "both" | "whatsapp" | "sms";
  whatsappReady: boolean;
  approvedTemplate: boolean;
  smsReady: boolean;
  smsRegistered: boolean;
  delaySeconds: number;
  screenVoicemail: boolean;
  whatsappText: string;
  smsText: string;
};
export type Decision =
  | {
      kind: "send";
      channel: Channel;
      format: "template" | "freeform" | "sms";
      reason: string;
    }
  | { kind: "manual" | "skip"; reason: string };
export function isMissed(outcome: CallOutcome, screenVoicemail: boolean) {
  return (
    ["no-answer", "busy", "failed"].includes(outcome) ||
    (outcome === "voicemail" && screenVoicemail)
  );
}
export function whatsappWindowOpen(consent: Consent, now: string) {
  if (!consent.lastInboundWhatsAppAt) return false;
  const age = Date.parse(now) - Date.parse(consent.lastInboundWhatsAppAt);
  return Number.isFinite(age) && age >= 0 && age < 24 * 60 * 60 * 1000;
}
export function channelEligibility(
  channel: Channel,
  settings: RecoverySettings,
  consent: Consent,
  now: string,
): Decision {
  if (consent.optedOut)
    return {
      kind: "manual",
      reason:
        "This customer opted out. Messaging is suppressed on both channels.",
    };
  if (channel === "WhatsApp") {
    if (!consent.whatsapp)
      return {
        kind: "manual",
        reason: "WhatsApp permission has not been recorded.",
      };
    if (!settings.whatsappReady)
      return { kind: "manual", reason: "The WhatsApp sender is unavailable." };
    if (whatsappWindowOpen(consent, now))
      return {
        kind: "send",
        channel,
        format: "freeform",
        reason:
          "WhatsApp permission and sender are ready; the 24-hour customer-service window is open.",
      };
    if (settings.approvedTemplate)
      return {
        kind: "send",
        channel,
        format: "template",
        reason:
          "WhatsApp permission and sender are ready; an approved template is available for the closed service window.",
      };
    return {
      kind: "manual",
      reason:
        "The WhatsApp service window is closed and no approved template is available.",
    };
  }
  if (!consent.sms)
    return {
      kind: "manual",
      reason: "SMS permission has not been recorded independently.",
    };
  if (!settings.smsReady)
    return { kind: "manual", reason: "The SMS sender is unavailable." };
  if (!settings.smsRegistered)
    return {
      kind: "manual",
      reason: "Required SMS sender registration is incomplete.",
    };
  return {
    kind: "send",
    channel,
    format: "sms",
    reason:
      "SMS has its own permission, a configured sender, and completed registration.",
  };
}
export function evaluateRecovery(
  outcome: CallOutcome,
  settings: RecoverySettings,
  consent: Consent,
  now: string,
): Decision {
  if (!isMissed(outcome, settings.screenVoicemail))
    return {
      kind: "skip",
      reason:
        outcome === "voicemail"
          ? "Without call screening, voicemail can look like an answered call. No recovery is started."
          : outcome === "ringing"
            ? "The call is still ringing. Choose its outcome first."
            : outcome === "canceled"
              ? "The caller canceled before an answer. This event is recorded without an automatic follow-up."
              : "The business answered. No missed-call recovery is needed.",
    };
  if (!settings.enabled)
    return { kind: "skip", reason: "Automatic recovery is switched off." };
  if (consent.optedOut)
    return {
      kind: "manual",
      reason:
        "This customer opted out. Messaging is suppressed on both channels.",
    };
  if (settings.mode === "sms")
    return channelEligibility("SMS", settings, consent, now);
  const whatsapp = channelEligibility("WhatsApp", settings, consent, now);
  if (whatsapp.kind === "send" || settings.mode === "whatsapp") return whatsapp;
  const sms = channelEligibility("SMS", settings, consent, now);
  return sms.kind === "send"
    ? { ...sms, reason: `${whatsapp.reason} ${sms.reason}` }
    : {
        kind: "manual",
        reason: `${whatsapp.reason} ${sms.reason} Review this lead manually.`,
      };
}
export function isOptOut(text: string) {
  return /^(stop|stopall|unsubscribe|cancel|end|quit|revoke|optout|opt out)$/i.test(
    text.trim(),
  );
}
export const noConsent: Consent = {
  whatsapp: false,
  sms: false,
  optedOut: false,
  lastInboundWhatsAppAt: null,
};
