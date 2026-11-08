import { z } from "zod";
import type { BusinessInput } from "@/lib/validation";
export const leadStatuses = [
  "New",
  "Contacted",
  "Interested",
  "Appointment Scheduled",
  "Won",
  "Lost",
] as const;
export const appointmentStatuses = [
  "Scheduled",
  "Completed",
  "Canceled",
] as const;
export const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .regex(
      /^\+[1-9]\d{7,14}$/,
      "Use an international phone number, such as +14155550100.",
    ),
  email: z.union([z.literal(""), z.email().max(254)]).default(""),
  source: z
    .enum(["Manual", "Phone", "WhatsApp", "SMS", "Website", "Referral"])
    .default("Manual"),
  status: z.enum(leadStatuses).default("New"),
  notes: z.string().max(4000).default(""),
});
export const appointmentSchema = z
  .object({
    lead_id: z.uuid(),
    title: z.string().trim().min(2).max(150),
    starts_at: z.iso.datetime({ offset: true }),
    ends_at: z.iso.datetime({ offset: true }),
    status: z.enum(appointmentStatuses).default("Scheduled"),
    notes: z.string().max(2000).default(""),
  })
  .refine((v) => new Date(v.ends_at) > new Date(v.starts_at), {
    message: "The end time must be after the start time.",
    path: ["ends_at"],
  });
export const conversationSchema = z.object({
  lead_id: z.uuid(),
  channel: z.enum(["WhatsApp", "SMS"]),
});
export const conversationUpdateSchema = z.object({
  unread: z.boolean(),
  assigned_to: z.string().trim().max(100).default(""),
});
export const messageSchema = z.object({
  conversation_id: z.uuid(),
  body: z.string().trim().min(1).max(1600),
});
export type LeadInput = z.infer<typeof leadSchema>;
export type Lead = LeadInput & {
  id: string;
  business_id: string;
  created_at: string;
  updated_at: string;
};
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type Appointment = AppointmentInput & {
  id: string;
  business_id: string;
  created_at: string;
};
export type Conversation = {
  id: string;
  business_id: string;
  lead_id: string;
  channel: "WhatsApp" | "SMS";
  unread: boolean;
  assigned_to: string;
  created_at: string;
};
export type Message = {
  id: string;
  business_id: string;
  conversation_id: string;
  body: string;
  direction: "inbound" | "outbound";
  status: "draft" | "simulated";
  created_at: string;
};
export type Notice = {
  id: string;
  business_id: string;
  title: string;
  read: boolean;
  created_at: string;
};
export type WorkspaceData = {
  business: BusinessInput;
  leads: Lead[];
  appointments: Appointment[];
  conversations: Conversation[];
  messages: Message[];
  notifications: Notice[];
};
export type Command =
  | { action: "saveLead"; id?: string; data: LeadInput }
  | { action: "saveAppointment"; id?: string; data: AppointmentInput }
  | { action: "createConversation"; data: z.infer<typeof conversationSchema> }
  | {
      action: "updateConversation";
      id: string;
      data: z.infer<typeof conversationUpdateSchema>;
    }
  | { action: "saveMessage"; id?: string; data: z.infer<typeof messageSchema> }
  | { action: "simulateReply"; data: z.infer<typeof messageSchema> }
  | { action: "readNotifications" }
  | { action: "saveBusiness"; data: BusinessInput };
export function emptyWorkspace(business: BusinessInput): WorkspaceData {
  return {
    business,
    leads: [],
    appointments: [],
    conversations: [],
    messages: [],
    notifications: [],
  };
}
export function summary(data: WorkspaceData) {
  return {
    leads: data.leads.length,
    won: data.leads.filter((l) => l.status === "Won").length,
    appointments: data.appointments.filter((a) => a.status !== "Canceled")
      .length,
    replies: data.messages.filter((m) => m.direction === "inbound").length,
  };
}
