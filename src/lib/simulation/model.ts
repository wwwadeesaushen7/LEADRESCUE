import { z } from "zod";
import type {
  CallOutcome,
  Channel,
  Consent,
  RecoverySettings,
} from "@/lib/recovery/policy";
export const settingsSchema = z.object({
  enabled: z.boolean(),
  mode: z.enum(["both", "whatsapp", "sms"]),
  whatsappReady: z.boolean(),
  approvedTemplate: z.boolean(),
  smsReady: z.boolean(),
  smsRegistered: z.boolean(),
  delaySeconds: z.number().int().min(0).max(3600),
  screenVoicemail: z.boolean(),
  whatsappText: z.string().trim().min(1).max(600),
  smsText: z.string().trim().min(1).max(600),
});
export const permissionsSchema = z.object({
  whatsapp: z.boolean(),
  sms: z.boolean(),
  optedOut: z.boolean(),
  windowOpen: z.boolean(),
});
export type RecoveryState =
  | "pending"
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "canceled"
  | "manual"
  | "skipped";
export type SimCall = {
  id: string;
  lead_id: string;
  created_at: string;
  outcome: CallOutcome;
  missed: boolean;
  screened: boolean;
  processed: boolean;
  recovery: RecoveryState;
  reason: string;
  channel: Channel | null;
  format: "template" | "freeform" | "sms" | null;
  message_id: string | null;
  due_at: string | null;
  replied_at: string | null;
  appointment_id: string | null;
  won_at: string | null;
  duplicate_count: number;
};
export type SimLog = {
  id: string;
  call_id: string | null;
  lead_id: string | null;
  at: string;
  text: string;
};
export type Simulation = {
  version: 1;
  clock: string;
  settings: RecoverySettings;
  permissions: Record<string, Consent>;
  calls: SimCall[];
  log: SimLog[];
  activeCallId: string | null;
  prepared: {
    key: string;
    lead_id: string;
    outcome: Exclude<CallOutcome, "ringing">;
    scenario: ScenarioId;
  } | null;
};
export type ScenarioId =
  | "whatsapp"
  | "sms-fallback"
  | "no-consent"
  | "opt-out"
  | "failure"
  | "duplicate"
  | "answered"
  | "voicemail";
export const scenarios: {
  id: ScenarioId;
  title: string;
  description: string;
}[] = [
  {
    id: "whatsapp",
    title: "WhatsApp recovery",
    description: "Permission, approved template, and sender ready.",
  },
  {
    id: "sms-fallback",
    title: "SMS fallback",
    description: "WhatsApp unavailable; SMS has separate permission.",
  },
  {
    id: "no-consent",
    title: "No permission",
    description: "Neither messaging channel has consent.",
  },
  {
    id: "opt-out",
    title: "Customer opted out",
    description: "An opt-out overrides both consent switches.",
  },
  {
    id: "failure",
    title: "Delivery failure",
    description: "Try a failed delivery without a second-channel send.",
  },
  {
    id: "duplicate",
    title: "Duplicate event",
    description: "Replay the same missed call without another message.",
  },
  {
    id: "answered",
    title: "Answered call",
    description: "A successful call needs no recovery.",
  },
  {
    id: "voicemail",
    title: "Voicemail screening",
    description: "Compare voicemail with and without call screening.",
  },
];
export type SimulationCommand =
  | { type: "prepare"; scenario: ScenarioId }
  | { type: "settings"; data: RecoverySettings }
  | {
      type: "permissions";
      lead_id: string;
      data: z.infer<typeof permissionsSchema>;
    }
  | { type: "start"; lead_id: string }
  | {
      type: "finish";
      call_id: string;
      outcome: Exclude<CallOutcome, "ringing">;
    }
  | { type: "process"; call_id: string }
  | { type: "advance"; seconds: number }
  | { type: "delivery"; call_id: string; status: "delivered" | "failed" }
  | { type: "reply"; call_id: string; body: string }
  | {
      type: "book";
      call_id: string;
      title: string;
      starts_at: string;
      ends_at: string;
    }
  | { type: "won"; call_id: string }
  | { type: "select"; call_id: string };
export const defaultSettings: RecoverySettings = {
  enabled: true,
  mode: "both",
  whatsappReady: true,
  approvedTemplate: true,
  smsReady: true,
  smsRegistered: true,
  delaySeconds: 0,
  screenVoicemail: false,
  whatsappText:
    "Hi {{customer}}! This is {{business}}. Sorry we missed your call. How can we help?",
  smsText:
    "Hi {{customer}}! This is {{business}}. Sorry we missed your call. How can we help? Reply STOP to opt out.",
};
export function newSimulation(now = new Date().toISOString()): Simulation {
  return {
    version: 1,
    clock: now,
    settings: { ...defaultSettings },
    permissions: {},
    calls: [],
    log: [],
    activeCallId: null,
    prepared: null,
  };
}
