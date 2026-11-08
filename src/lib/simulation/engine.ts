import { z } from "zod";
import type { WorkspaceData, Message } from "@/lib/workspace/model";
import { appointmentSchema } from "@/lib/workspace/model";
import {
  channelEligibility,
  evaluateRecovery,
  isMissed,
  isOptOut,
  noConsent,
  whatsappWindowOpen,
  type Channel,
  type Consent,
} from "@/lib/recovery/policy";
import {
  defaultSettings,
  newSimulation,
  permissionsSchema,
  scenarios,
  settingsSchema,
  type SimCall,
  type SimulationCommand,
} from "./model";
const BUSINESS = "10000000-0000-4000-8000-000000000000";
export function ensureSimulation(data: WorkspaceData) {
  return data.simulation ?? (data.simulation = newSimulation());
}
function log(
  data: WorkspaceData,
  text: string,
  call: SimCall | null = null,
  leadId: string | null = null,
) {
  const s = ensureSimulation(data);
  s.log.unshift({
    id: crypto.randomUUID(),
    at: s.clock,
    text,
    call_id: call?.id || null,
    lead_id: call?.lead_id || leadId,
  });
  s.log = s.log.slice(0, 500);
}
function notify(data: WorkspaceData, title: string) {
  data.notifications.unshift({
    id: crypto.randomUUID(),
    business_id: BUSINESS,
    title,
    read: false,
    created_at: ensureSimulation(data).clock,
  });
}
export function consentFor(data: WorkspaceData, leadId: string): Consent {
  return data.simulation?.permissions[leadId] || { ...noConsent };
}
export function previewMessage(
  data: WorkspaceData,
  leadId: string,
  channel: Channel,
) {
  const s = ensureSimulation(data),
    lead = data.leads.find((l) => l.id === leadId);
  if (!lead) throw new Error("Choose a demo customer.");
  let text = (
    channel === "WhatsApp" ? s.settings.whatsappText : s.settings.smsText
  )
    .replaceAll("{{business}}", data.business.name)
    .replaceAll("{{customer}}", lead.name.split(" ")[0]);
  if (channel === "SMS" && !/reply stop to opt out/i.test(text))
    text += " Reply STOP to opt out.";
  return text;
}
function conversationFor(
  data: WorkspaceData,
  leadId: string,
  channel: Channel,
) {
  let conversation = data.conversations.find(
    (c) => c.lead_id === leadId && c.channel === channel,
  );
  if (!conversation) {
    conversation = {
      id: crypto.randomUUID(),
      business_id: BUSINESS,
      lead_id: leadId,
      channel,
      unread: false,
      assigned_to: "",
      created_at: ensureSimulation(data).clock,
    };
    data.conversations.unshift(conversation);
  }
  return conversation;
}
function cancelQueued(data: WorkspaceData, call: SimCall, reason: string) {
  call.recovery = "canceled";
  call.reason = reason;
  const message = data.messages.find((m) => m.id === call.message_id);
  if (message) message.delivery_status = "canceled";
  log(data, reason, call);
  notify(data, "Simulated follow-up canceled: " + reason);
}
function suppressQueued(data: WorkspaceData, leadId: string) {
  for (const call of ensureSimulation(data).calls)
    if (call.lead_id === leadId && call.recovery === "queued")
      cancelQueued(
        data,
        call,
        "Customer opted out before dispatch. The queued message was canceled.",
      );
}
function dispatchDue(data: WorkspaceData) {
  const s = ensureSimulation(data);
  for (const call of s.calls) {
    if (
      call.recovery !== "queued" ||
      !call.due_at ||
      Date.parse(call.due_at) > Date.parse(s.clock)
    )
      continue;
    const decision = evaluateRecovery(
      call.outcome,
      { ...s.settings, screenVoicemail: call.screened },
      consentFor(data, call.lead_id),
      s.clock,
    );
    if (decision.kind !== "send" || decision.channel !== call.channel) {
      cancelQueued(
        data,
        call,
        decision.kind === "send"
          ? "Channel eligibility changed while waiting. No alternate-channel message was sent."
          : decision.reason,
      );
      continue;
    }
    const message = data.messages.find((m) => m.id === call.message_id);
    if (!message) throw new Error("The queued demo message is missing.");
    // Re-evaluate the service window at dispatch; a template may now be required.
    call.format = decision.format;
    call.reason = decision.reason;
    call.recovery = "sent";
    message.delivery_status = "sent";
    log(
      data,
      `Simulated ${call.channel} send using ${decision.format === "template" ? "an approved demo template" : "the eligible message"}. No provider was contacted.`,
      call,
    );
  }
}
function processCall(data: WorkspaceData, call: SimCall) {
  const s = ensureSimulation(data);
  if (call.outcome === "ringing")
    throw new Error("Finish the ringing call first.");
  if (call.processed) {
    call.duplicate_count++;
    log(
      data,
      "Duplicate missed-call event ignored. No new recovery attempt or message was created.",
      call,
    );
    return;
  }
  call.processed = true;
  const decision = evaluateRecovery(
    call.outcome,
    { ...s.settings, screenVoicemail: call.screened },
    consentFor(data, call.lead_id),
    s.clock,
  );
  call.reason = decision.reason;
  log(data, decision.reason, call);
  if (decision.kind !== "send") {
    call.recovery = decision.kind === "manual" ? "manual" : "skipped";
    if (decision.kind === "manual")
      notify(data, "Simulated call needs review: " + decision.reason);
    return;
  }
  const conversation = conversationFor(data, call.lead_id, decision.channel);
  const message: Message = {
    id: crypto.randomUUID(),
    business_id: BUSINESS,
    conversation_id: conversation.id,
    body: previewMessage(data, call.lead_id, decision.channel),
    direction: "outbound",
    status: "simulated",
    created_at: s.clock,
    simulation_call_id: call.id,
    delivery_status: "queued",
  };
  data.messages.push(message);
  call.channel = decision.channel;
  call.format = decision.format;
  call.message_id = message.id;
  call.recovery = "queued";
  call.due_at = new Date(
    Date.parse(s.clock) + s.settings.delaySeconds * 1000,
  ).toISOString();
  log(
    data,
    `One ${decision.channel} follow-up queued with a ${s.settings.delaySeconds}-second demo delay.`,
    call,
  );
  dispatchDue(data);
}
// This is also used by the demo inbox so STOP cannot be bypassed by changing screens.
export function validateSimulatedOutbound(
  data: WorkspaceData,
  conversationId: string,
) {
  const conversation = data.conversations.find((c) => c.id === conversationId);
  if (!conversation) throw new Error("Conversation not found.");
  const s = data.simulation,
    consent = s?.permissions[conversation.lead_id];
  if (s && consent) {
    if (
      conversation.channel === "WhatsApp" &&
      !whatsappWindowOpen(consent, s.clock) &&
      !consent.optedOut
    )
      throw new Error(
        "A free-text WhatsApp reply needs an open 24-hour customer-service window. Simulate an incoming customer reply first.",
      );
    const decision = channelEligibility(
      conversation.channel,
      s.settings,
      consent,
      s.clock,
    );
    if (decision.kind !== "send") throw new Error(decision.reason);
  }
}
export function recordSimulatedInbound(data: WorkspaceData, message: Message) {
  const s = ensureSimulation(data),
    conversation = data.conversations.find(
      (c) => c.id === message.conversation_id,
    );
  if (!conversation) throw new Error("Conversation not found.");
  const consent = { ...consentFor(data, conversation.lead_id) };
  if (conversation.channel === "WhatsApp")
    consent.lastInboundWhatsAppAt = s.clock;
  const call = s.calls.find(
    (c) =>
      c.lead_id === conversation.lead_id &&
      c.channel === conversation.channel &&
      c.processed &&
      (message.simulation_call_id
        ? c.id === message.simulation_call_id
        : ["sent", "delivered"].includes(c.recovery)),
  );
  if (call) message.simulation_call_id = call.id;
  if (isOptOut(message.body)) {
    consent.optedOut = true;
    s.permissions[conversation.lead_id] = consent;
    suppressQueued(data, conversation.lead_id);
    log(
      data,
      "Customer sent an opt-out keyword. Both channels are suppressed; a missed call will not restore consent.",
      call || null,
      conversation.lead_id,
    );
    notify(data, "Simulated customer opt-out recorded.");
  } else {
    if (call || s.permissions[conversation.lead_id])
      s.permissions[conversation.lead_id] = consent;
    if (call) call.replied_at = s.clock;
    log(
      data,
      `Simulated incoming ${conversation.channel} reply received.`,
      call || null,
      conversation.lead_id,
    );
  }
  conversation.unread = true;
}
export function linkSimulationAppointment(
  data: WorkspaceData,
  appointmentId: string,
) {
  const a = data.appointments.find((a) => a.id === appointmentId),
    s = data.simulation;
  if (!a || !s) return;
  for (const c of s.calls)
    if (
      c.appointment_id === a.id &&
      (c.lead_id !== a.lead_id || a.status === "Canceled")
    ) {
      c.appointment_id = null;
      c.won_at = null;
    }
  const call = s.calls.find(
    (c) => c.lead_id === a.lead_id && c.missed && c.replied_at,
  );
  if (call && a.status !== "Canceled") {
    call.appointment_id = a.id;
    log(data, `Appointment linked: ${a.title}.`, call);
  }
}
export function syncSimulationWin(
  data: WorkspaceData,
  leadId: string,
  callId?: string,
) {
  const s = data.simulation,
    lead = data.leads.find((l) => l.id === leadId);
  if (!s || !lead) return;
  if (lead.status !== "Won") {
    for (const c of s.calls) if (c.lead_id === leadId) c.won_at = null;
    return;
  }
  const call = s.calls.find(
    (c) =>
      c.lead_id === leadId &&
      c.missed &&
      c.replied_at &&
      data.appointments.some(
        (a) => a.id === c.appointment_id && a.status !== "Canceled",
      ) &&
      (!callId || c.id === callId),
  );
  if (call && !call.won_at) {
    call.won_at = s.clock;
    log(
      data,
      "The business manually marked this lead as won. A sent message alone did not count as recovery.",
      call,
    );
    notify(data, "Simulated recovery confirmed: " + lead.name);
  }
}
export function applySimulationCommand(
  current: WorkspaceData,
  cmd: SimulationCommand,
): WorkspaceData {
  const data = structuredClone(current),
    s = ensureSimulation(data);
  s.clock = new Date(Date.parse(s.clock) + 1).toISOString();
  const findCall = (id: string) => {
    const call = s.calls.find((c) => c.id === id);
    if (!call) throw new Error("Choose a simulated call first.");
    return call;
  };
  if (cmd.type === "prepare") {
    const index = scenarios.findIndex((x) => x.id === cmd.scenario);
    if (index < 0) throw new Error("Choose a supported test case.");
    const phone = `+120255501${70 + index}`;
    let lead = data.leads.find((l) => l.phone === phone);
    if (!lead) {
      lead = {
        id: crypto.randomUUID(),
        business_id: BUSINESS,
        name: [
          "Morgan Lane",
          "Riley Brooks",
          "Avery Reed",
          "Taylor Quinn",
          "Casey Park",
          "Jordan Ellis",
          "Alex Rivers",
          "Sam Bennett",
        ][index],
        phone,
        email: "",
        source: "Phone",
        status: "New",
        notes: "Fictional recovery simulator customer.",
        created_at: s.clock,
        updated_at: s.clock,
      };
      data.leads.unshift(lead);
      notify(data, "Demo customer created: " + lead.name);
    }
    s.settings = {
      ...defaultSettings,
      whatsappReady: cmd.scenario !== "sms-fallback",
      screenVoicemail: cmd.scenario === "voicemail",
    };
    s.permissions[lead.id] = {
      whatsapp: cmd.scenario !== "no-consent",
      sms: cmd.scenario !== "no-consent",
      optedOut: cmd.scenario === "opt-out",
      lastInboundWhatsAppAt: null,
    };
    if (s.permissions[lead.id].optedOut) suppressQueued(data, lead.id);
    s.activeCallId = null;
    s.prepared = {
      key: crypto.randomUUID(),
      lead_id: lead.id,
      scenario: cmd.scenario,
      outcome:
        cmd.scenario === "answered"
          ? "answered"
          : cmd.scenario === "voicemail"
            ? "voicemail"
            : "no-answer",
    };
    log(
      data,
      `Prepared the ${scenarios[index].title} test case with fictional consent settings.`,
      null,
      lead.id,
    );
  } else if (cmd.type === "settings") {
    s.settings = settingsSchema.parse(cmd.data);
    for (const template of [s.settings.whatsappText, s.settings.smsText])
      if (/{{(?!business}}|customer}})[^}]*}}/.test(template))
        throw new Error(
          "Use only {{business}} and {{customer}} as message placeholders.",
        );
    log(data, "Demo recovery settings updated.");
    dispatchDue(data);
  } else if (cmd.type === "permissions") {
    if (!data.leads.some((l) => l.id === cmd.lead_id))
      throw new Error("Choose a demo customer.");
    const parsed = permissionsSchema.parse(cmd.data);
    s.permissions[cmd.lead_id] = {
      whatsapp: parsed.whatsapp,
      sms: parsed.sms,
      optedOut: parsed.optedOut,
      lastInboundWhatsAppAt: parsed.windowOpen ? s.clock : null,
    };
    log(
      data,
      `Demo permission update: WhatsApp ${parsed.whatsapp ? "allowed" : "not allowed"}, SMS ${parsed.sms ? "allowed" : "not allowed"}, opt-out ${parsed.optedOut ? "on" : "off"}.`,
      null,
      cmd.lead_id,
    );
    if (parsed.optedOut) suppressQueued(data, cmd.lead_id);
  } else if (cmd.type === "start") {
    if (!data.leads.some((l) => l.id === cmd.lead_id))
      throw new Error("Choose a demo customer.");
    s.permissions[cmd.lead_id] ??= { ...noConsent };
    if (s.calls.length >= 500)
      throw new Error(
        "This browser has reached 500 simulated calls. Use a separate browser profile for a fresh demo.",
      );
    const call: SimCall = {
      id: crypto.randomUUID(),
      lead_id: cmd.lead_id,
      created_at: s.clock,
      outcome: "ringing",
      screened: s.settings.screenVoicemail,
      missed: false,
      processed: false,
      recovery: "pending",
      reason: "Incoming call is ringing.",
      channel: null,
      format: null,
      message_id: null,
      due_at: null,
      replied_at: null,
      appointment_id: null,
      won_at: null,
      duplicate_count: 0,
    };
    s.calls.unshift(call);
    s.activeCallId = call.id;
    log(data, "Simulated incoming call is ringing.", call);
    notify(data, "Simulated incoming call.");
  } else if (cmd.type === "finish") {
    const call = findCall(cmd.call_id);
    z.enum([
      "answered",
      "no-answer",
      "busy",
      "failed",
      "canceled",
      "voicemail",
    ]).parse(cmd.outcome);
    if (call.outcome !== "ringing") {
      if (call.outcome === cmd.outcome) processCall(data, call);
      else
        throw new Error(
          "A completed call outcome cannot be changed. Start another call.",
        );
    } else {
      call.outcome = cmd.outcome;
      call.missed = isMissed(cmd.outcome, call.screened);
      log(
        data,
        `Call outcome: ${cmd.outcome}${call.screened ? " (call screening enabled)" : ""}.`,
        call,
      );
      if (call.missed) notify(data, "Simulated missed call.");
      processCall(data, call);
    }
  } else if (cmd.type === "process") processCall(data, findCall(cmd.call_id));
  else if (cmd.type === "advance") {
    z.number()
      .int()
      .min(1)
      .max(86400 * 2)
      .parse(cmd.seconds);
    s.clock = new Date(Date.parse(s.clock) + cmd.seconds * 1000).toISOString();
    log(data, `Demo clock advanced by ${cmd.seconds} seconds.`);
    dispatchDue(data);
  } else if (cmd.type === "delivery") {
    z.enum(["delivered", "failed"]).parse(cmd.status);
    const call = findCall(cmd.call_id);
    if (call.recovery === cmd.status) {
      log(data, "Duplicate delivery update ignored.", call);
      return data;
    }
    if (call.recovery !== "sent")
      throw new Error(
        "Only a sent demo message can receive its first delivery result.",
      );
    call.recovery = cmd.status;
    const message = data.messages.find((m) => m.id === call.message_id);
    if (message) message.delivery_status = cmd.status;
    if (cmd.status === "failed")
      call.reason =
        "Delivery failed. No automatic retry or SMS resend was created.";
    log(
      data,
      cmd.status === "failed"
        ? "Delivery failed. No automatic retry or SMS resend was created."
        : `Simulated ${call.channel} delivery confirmed.`,
      call,
    );
    if (cmd.status === "failed")
      notify(
        data,
        "Simulated message delivery failed. Review the conversation manually.",
      );
  } else if (cmd.type === "reply") {
    const call = findCall(cmd.call_id);
    if (!call.channel || !["sent", "delivered"].includes(call.recovery))
      throw new Error(
        "Simulate a sent message before adding its customer reply.",
      );
    const body = z.string().trim().min(1).max(1600).parse(cmd.body),
      conversation = conversationFor(data, call.lead_id, call.channel);
    const message: Message = {
      id: crypto.randomUUID(),
      business_id: BUSINESS,
      conversation_id: conversation.id,
      body,
      direction: "inbound",
      status: "simulated",
      created_at: s.clock,
      simulation_call_id: call.id,
    };
    data.messages.push(message);
    recordSimulatedInbound(data, message);
    notify(data, "Simulated customer reply received.");
  } else if (cmd.type === "book") {
    const call = findCall(cmd.call_id);
    if (!call.replied_at)
      throw new Error(
        "Simulate a customer reply before booking this recovery.",
      );
    if (
      call.appointment_id &&
      data.appointments.some(
        (a) => a.id === call.appointment_id && a.status !== "Canceled",
      )
    )
      throw new Error(
        "This recovery already has an appointment. Edit it on the Appointments page.",
      );
    const parsed = appointmentSchema.parse({
      lead_id: call.lead_id,
      title: cmd.title,
      starts_at: cmd.starts_at,
      ends_at: cmd.ends_at,
      status: "Scheduled",
      notes: "Created in the recovery simulator.",
    });
    if (
      data.appointments.some(
        (a) =>
          a.status === "Scheduled" &&
          Date.parse(a.starts_at) < Date.parse(parsed.ends_at) &&
          Date.parse(a.ends_at) > Date.parse(parsed.starts_at),
      )
    )
      throw new Error("Another appointment overlaps this time.");
    const appointment = {
      ...parsed,
      id: crypto.randomUUID(),
      business_id: BUSINESS,
      created_at: s.clock,
    };
    data.appointments.unshift(appointment);
    call.appointment_id = appointment.id;
    const lead = data.leads.find((l) => l.id === call.lead_id)!;
    lead.status = "Appointment Scheduled";
    lead.updated_at = s.clock;
    log(data, "Demo appointment saved and linked to this customer.", call);
    notify(data, "Simulated appointment booked: " + parsed.title);
  } else if (cmd.type === "won") {
    const call = findCall(cmd.call_id);
    if (
      !call.replied_at ||
      !data.appointments.some(
        (a) => a.id === call.appointment_id && a.status !== "Canceled",
      )
    )
      throw new Error("Complete the customer reply and booking steps first.");
    const lead = data.leads.find((l) => l.id === call.lead_id)!;
    lead.status = "Won";
    lead.updated_at = s.clock;
    syncSimulationWin(data, lead.id, call.id);
  } else if (cmd.type === "select") s.activeCallId = findCall(cmd.call_id).id;
  return data;
}
export function simulationMetrics(data: WorkspaceData) {
  const calls = data.simulation?.calls || [],
    ids = new Set(calls.map((c) => c.id)),
    messages = data.messages.filter(
      (m) => m.simulation_call_id && ids.has(m.simulation_call_id),
    );
  const successful = new Set(
    calls
      .filter(
        (c) =>
          c.won_at &&
          data.leads.some((l) => l.id === c.lead_id && l.status === "Won"),
      )
      .map((c) => c.lead_id),
  );
  return {
    calls: calls.length,
    answered: calls.filter(
      (c) =>
        c.outcome === "answered" || (c.outcome === "voicemail" && !c.screened),
    ).length,
    missed: calls.filter((c) => c.missed).length,
    attempts: calls.filter((c) => c.message_id).length,
    whatsapp: messages.filter(
      (m) =>
        m.direction === "outbound" &&
        ["sent", "delivered", "failed"].includes(m.delivery_status || "") &&
        data.conversations.find((c) => c.id === m.conversation_id)?.channel ===
          "WhatsApp",
    ).length,
    sms: messages.filter(
      (m) =>
        m.direction === "outbound" &&
        ["sent", "delivered", "failed"].includes(m.delivery_status || "") &&
        data.conversations.find((c) => c.id === m.conversation_id)?.channel ===
          "SMS",
    ).length,
    replies: messages.filter(
      (m) => m.direction === "inbound" && !isOptOut(m.body),
    ).length,
    leads: new Set(calls.map((c) => c.lead_id)).size,
    appointments: new Set(
      calls
        .filter((c) =>
          data.appointments.some(
            (a) => a.id === c.appointment_id && a.status !== "Canceled",
          ),
        )
        .map((c) => c.appointment_id),
    ).size,
    won: successful.size,
  };
}
