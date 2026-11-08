import {
  applySimulationCommand,
  ensureSimulation,
  validateSimulatedOutbound,
  recordSimulatedInbound,
  linkSimulationAppointment,
  syncSimulationWin,
} from "@/lib/simulation/engine";
import {
  emptyWorkspace,
  leadSchema,
  appointmentSchema,
  conversationSchema,
  messageSchema,
  conversationUpdateSchema,
  type WorkspaceData,
  type Command,
} from "./model";
import { businessSchema, type BusinessInput } from "@/lib/validation";
const BUSINESS = "10000000-0000-4000-8000-000000000000";
const id = (n: number) =>
  `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export function seedWorkspace(business: BusinessInput): WorkspaceData {
  const data = emptyWorkspace(business),
    now = new Date().toISOString();
  data.leads = [
    "Olivia Martin",
    "James Wilson",
    "Sophia Chen",
    "Noah Williams",
  ].map((name, i) => ({
    id: id(i + 1),
    business_id: BUSINESS,
    name,
    phone: `+1202555010${i + 1}`,
    email: "",
    source: i % 2 ? "SMS" : "WhatsApp",
    status: i === 2 ? "Appointment Scheduled" : i === 0 ? "Interested" : "New",
    notes: [
      "Leaking kitchen faucet",
      "Water heater repair",
      "Bathroom renovation",
      "Drain cleaning",
    ][i],
    created_at: now,
    updated_at: now,
  }));
  data.conversations = data.leads.slice(0, 3).map((l, i) => ({
    id: id(i + 10),
    business_id: BUSINESS,
    lead_id: l.id,
    channel: i === 1 ? "SMS" : "WhatsApp",
    unread: i === 0,
    assigned_to: "",
    created_at: now,
  }));
  data.messages = data.conversations.flatMap((c, i) => [
    {
      id: id(i + 20),
      business_id: BUSINESS,
      conversation_id: c.id,
      body: `Hi! This is ${business.name}. How can we help?`,
      direction: "outbound" as const,
      status: "simulated" as const,
      created_at: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: id(i + 30),
      business_id: BUSINESS,
      conversation_id: c.id,
      body: [
        "Our kitchen faucet is leaking. Can someone come this week?",
        "Could you help with a water heater repair?",
        "I’d like to discuss our bathroom renovation.",
      ][i],
      direction: "inbound" as const,
      status: "simulated" as const,
      created_at: now,
    },
  ]);
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 1);
  start.setUTCHours(15, 0, 0, 0);
  data.appointments = [
    {
      id: id(50),
      business_id: BUSINESS,
      lead_id: id(3),
      title: "Bathroom renovation consultation",
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + 3600000).toISOString(),
      status: "Scheduled",
      notes: "Discuss ideas and take measurements.",
      created_at: now,
    },
  ];
  data.notifications = [
    {
      id: id(40),
      business_id: BUSINESS,
      title: "Sample: Sophia has a new appointment.",
      read: false,
      created_at: now,
    },
  ];
  ensureSimulation(data);
  return data;
}
export function applyDemoCommand(
  current: WorkspaceData,
  cmd: Command,
): WorkspaceData {
  if (cmd.action === "simulation")
    return applySimulationCommand(current, cmd.data);
  const data = structuredClone(current);
  const simulation = ensureSimulation(data);
  simulation.clock = new Date(
    Math.max(Date.parse(simulation.clock) + 1, Date.now()),
  ).toISOString();
  const now = simulation.clock;
  const notify = (title: string) =>
    data.notifications.unshift({
      id: crypto.randomUUID(),
      business_id: BUSINESS,
      title,
      read: false,
      created_at: now,
    });
  if (cmd.action === "saveLead") {
    const parsed = leadSchema.parse(cmd.data);
    if (data.leads.some((l) => l.phone === parsed.phone && l.id !== cmd.id))
      throw new Error("This phone number already exists.");
    if (cmd.id) {
      const lead = data.leads.find((l) => l.id === cmd.id);
      if (!lead) throw new Error("Customer not found.");
      Object.assign(lead, parsed, { updated_at: now });
    } else
      data.leads.unshift({
        ...parsed,
        id: crypto.randomUUID(),
        business_id: BUSINESS,
        created_at: now,
        updated_at: now,
      });
    if (cmd.id) syncSimulationWin(data, cmd.id);
    notify(`${cmd.id ? "Updated" : "New lead"}: ${parsed.name}`);
  } else if (cmd.action === "saveAppointment") {
    const parsed = appointmentSchema.parse(cmd.data);
    if (!data.leads.some((l) => l.id === parsed.lead_id))
      throw new Error("Choose a customer.");
    if (
      parsed.status === "Scheduled" &&
      data.appointments.some(
        (a) =>
          a.id !== cmd.id &&
          a.status === "Scheduled" &&
          new Date(a.starts_at) < new Date(parsed.ends_at) &&
          new Date(a.ends_at) > new Date(parsed.starts_at),
      )
    )
      throw new Error("Another appointment overlaps this time.");
    if (cmd.id) {
      const a = data.appointments.find((a) => a.id === cmd.id);
      if (!a) throw new Error("Appointment not found.");
      Object.assign(a, parsed);
    } else
      data.appointments.unshift({
        ...parsed,
        id: crypto.randomUUID(),
        business_id: BUSINESS,
        created_at: now,
      });
    linkSimulationAppointment(data, cmd.id || data.appointments[0].id);
    notify(`Appointment ${parsed.status.toLowerCase()}: ${parsed.title}`);
  } else if (cmd.action === "createConversation") {
    const parsed = conversationSchema.parse(cmd.data);
    if (!data.leads.some((l) => l.id === parsed.lead_id))
      throw new Error("Choose a customer.");
    if (
      data.conversations.some(
        (c) => c.lead_id === parsed.lead_id && c.channel === parsed.channel,
      )
    )
      throw new Error("This conversation already exists.");
    data.conversations.unshift({
      ...parsed,
      id: crypto.randomUUID(),
      business_id: BUSINESS,
      unread: false,
      assigned_to: "",
      created_at: now,
    });
  } else if (cmd.action === "updateConversation") {
    const conversation = data.conversations.find((c) => c.id === cmd.id);
    if (!conversation) throw new Error("Conversation not found.");
    Object.assign(conversation, conversationUpdateSchema.parse(cmd.data));
  } else if (cmd.action === "saveMessage" || cmd.action === "simulateReply") {
    const parsed = messageSchema.parse(cmd.data),
      conversation = data.conversations.find(
        (c) => c.id === parsed.conversation_id,
      );
    if (!conversation) throw new Error("Conversation not found.");
    const incoming = cmd.action === "simulateReply";
    if (!incoming) validateSimulatedOutbound(data, conversation.id);
    if (cmd.action === "saveMessage" && cmd.id) {
      const message = data.messages.find(
        (m) => m.id === cmd.id && m.conversation_id === parsed.conversation_id,
      );
      if (!message) throw new Error("Message not found.");
      if (message.direction !== "outbound" || message.simulation_call_id)
        throw new Error(
          "Sent simulator history cannot be edited. Write a new reply.",
        );
      message.body = parsed.body;
    } else {
      const call = simulation.calls.find(
        (c) =>
          c.lead_id === conversation.lead_id &&
          c.channel === conversation.channel &&
          ["sent", "delivered"].includes(c.recovery),
      );
      data.messages.push({
        ...parsed,
        id: crypto.randomUUID(),
        business_id: BUSINESS,
        direction: incoming ? "inbound" : "outbound",
        status: "simulated",
        ...(call
          ? {
              simulation_call_id: call.id,
              ...(!incoming ? { delivery_status: "sent" as const } : {}),
            }
          : {}),
        created_at: now,
      });
      if (incoming) recordSimulatedInbound(data, data.messages.at(-1)!);
    }
    if (incoming) {
      conversation.unread = true;
      notify(`Simulated ${conversation.channel} reply received`);
    }
  } else if (cmd.action === "readNotifications")
    data.notifications.forEach((n) => (n.read = true));
  else data.business = businessSchema.parse(cmd.data);
  return data;
}
