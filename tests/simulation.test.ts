import { describe, it, expect } from "vitest";
import { seedWorkspace, applyDemoCommand } from "@/lib/workspace/demo";
import { sampleBusiness } from "@/lib/demo/session-data";
import {
  applySimulationCommand as step,
  simulationMetrics,
} from "@/lib/simulation/engine";
import { simulationActivity } from "@/lib/simulation/activity";
import {
  newSimulation,
  type ScenarioId,
  type SimulationCommand,
} from "@/lib/simulation/model";
import type { WorkspaceData } from "@/lib/workspace/model";
function fixture(scenario: ScenarioId = "whatsapp") {
  const data = seedWorkspace(sampleBusiness);
  data.simulation = newSimulation("2026-11-08T12:00:00.000Z");
  return step(data, { type: "prepare", scenario });
}
function start(
  data: WorkspaceData,
  outcome: "no-answer" | "answered" | "voicemail" = "no-answer",
) {
  data = step(data, {
    type: "start",
    lead_id: data.simulation!.prepared!.lead_id,
  });
  return step(data, {
    type: "finish",
    call_id: data.simulation!.activeCallId!,
    outcome,
  });
}
const active = (d: WorkspaceData) =>
  d.simulation!.calls.find((c) => c.id === d.simulation!.activeCallId)!;
const linked = (d: WorkspaceData) =>
  d.messages.filter((m) => m.simulation_call_id);
const send = (d: WorkspaceData, c: SimulationCommand) => step(d, c);
describe("Browser-only recovery state transitions", () => {
  it("persists a full call → reply → booking → explicit won journey without mutating previous snapshots", () => {
    const initial = fixture();
    let d = start(initial);
    const id = active(d).id;
    expect(initial.simulation!.calls).toHaveLength(0);
    expect(simulationMetrics(d)).toMatchObject({
      calls: 1,
      missed: 1,
      attempts: 1,
      whatsapp: 1,
      won: 0,
    });
    d = send(d, { type: "delivery", call_id: id, status: "delivered" });
    expect(simulationMetrics(d).won).toBe(0);
    d = send(d, { type: "reply", call_id: id, body: "Could I book a visit?" });
    d = send(d, {
      type: "book",
      call_id: id,
      title: "Repair visit",
      starts_at: "2026-12-12T10:00:00Z",
      ends_at: "2026-12-12T11:00:00Z",
    });
    expect(simulationMetrics(d)).toMatchObject({
      replies: 1,
      appointments: 1,
      won: 0,
    });
    d = send(d, { type: "won", call_id: id });
    d = JSON.parse(JSON.stringify(d));
    expect(simulationMetrics(d)).toMatchObject({
      replies: 1,
      appointments: 1,
      won: 1,
    });
    expect(d.leads.find((l) => l.id === active(d).lead_id)?.status).toBe("Won");
    const notice = d.notifications.find((n) =>
      n.title.includes("recovery confirmed"),
    );
    expect(notice).toBeDefined();
  });
  it.each([
    ["sms-fallback", "sent", "SMS"],
    ["no-consent", "manual", null],
    ["opt-out", "manual", null],
  ] as const)(
    "handles the %s preset without extra channels",
    (scenario, state, channel) => {
      const d = start(fixture(scenario));
      expect(active(d)).toMatchObject({ recovery: state, channel });
      expect(linked(d)).toHaveLength(channel ? 1 : 0);
    },
  );
  it("never retries a duplicate event or failed delivery on another channel", () => {
    let d = start(fixture("duplicate"));
    const id = active(d).id;
    for (let n = 0; n < 4; n++) d = send(d, { type: "process", call_id: id });
    d = send(d, { type: "delivery", call_id: id, status: "failed" });
    d = send(d, { type: "delivery", call_id: id, status: "failed" });
    d = send(d, { type: "process", call_id: id });
    expect(simulationMetrics(d)).toMatchObject({
      calls: 1,
      attempts: 1,
      whatsapp: 1,
      sms: 0,
      won: 0,
    });
    expect(linked(d)).toHaveLength(1);
    expect(active(d).duplicate_count).toBe(5);
    expect(() =>
      send(d, { type: "delivery", call_id: id, status: "delivered" }),
    ).toThrow("first delivery");
    expect(() =>
      send(d, { type: "finish", call_id: id, outcome: "answered" }),
    ).toThrow("cannot be changed");
  });
  it("cancels a queued send on STOP across screens and keeps both channels suppressed on future calls", () => {
    let d = fixture();
    d = send(d, {
      type: "settings",
      data: { ...d.simulation!.settings, delaySeconds: 60 },
    });
    d = start(d);
    const msg = linked(d)[0];
    expect(msg.delivery_status).toBe("queued");
    d = applyDemoCommand(d, {
      action: "simulateReply",
      data: { conversation_id: msg.conversation_id, body: " STOP " },
    });
    expect(active(d).recovery).toBe("canceled");
    d = send(d, { type: "advance", seconds: 120 });
    expect(linked(d)[0].delivery_status).toBe("canceled");
    expect(() =>
      applyDemoCommand(d, {
        action: "saveMessage",
        data: {
          conversation_id: msg.conversation_id,
          body: "Attempt to bypass STOP",
        },
      }),
    ).toThrow("opted out");
    const id = active(d).lead_id;
    d = applyDemoCommand(d, {
      action: "createConversation",
      data: { lead_id: id, channel: "SMS" },
    });
    expect(() =>
      applyDemoCommand(d, {
        action: "saveMessage",
        data: {
          conversation_id: d.conversations[0].id,
          body: "Try another channel",
        },
      }),
    ).toThrow("opted out");
    d = start(d);
    expect(active(d).recovery).toBe("manual");
    expect(simulationMetrics(d)).toMatchObject({
      whatsapp: 0,
      sms: 0,
      replies: 0,
      won: 0,
    });
  });
  it("rechecks permission, service window, mode, sender and automation settings at dispatch without switching channels", () => {
    for (const change of ["consent", "window", "mode", "sender", "disabled"]) {
      let d = fixture();
      const leadId = d.simulation!.prepared!.lead_id;
      d = send(d, {
        type: "settings",
        data: {
          ...d.simulation!.settings,
          delaySeconds: 60,
          approvedTemplate: false,
        },
      });
      d = send(d, {
        type: "permissions",
        lead_id: leadId,
        data: { whatsapp: true, sms: true, optedOut: false, windowOpen: true },
      });
      d = start(d);
      expect(active(d).recovery).toBe("queued");
      if (change === "consent")
        d = send(d, {
          type: "permissions",
          lead_id: leadId,
          data: {
            whatsapp: false,
            sms: true,
            optedOut: false,
            windowOpen: true,
          },
        });
      else if (change !== "window")
        d = send(d, {
          type: "settings",
          data: {
            ...d.simulation!.settings,
            ...(change === "mode"
              ? { mode: "sms" as const }
              : change === "sender"
                ? { whatsappReady: false }
                : { enabled: false }),
          },
        });
      d = send(d, {
        type: "advance",
        seconds: change === "window" ? 86400 : 60,
      });
      expect(active(d).recovery).toBe("canceled");
      expect(simulationMetrics(d)).toMatchObject({ whatsapp: 0, sms: 0 });
      expect(linked(d)).toHaveLength(1);
    }
  });
  it("dispatches only once after the chosen delay and renders placeholders", () => {
    let d = fixture();
    d = send(d, {
      type: "settings",
      data: {
        ...d.simulation!.settings,
        mode: "sms",
        delaySeconds: 60,
        smsText: "Hi {{customer}}, from {{business}}.",
      },
    });
    d = start(d);
    d = send(d, { type: "advance", seconds: 30 });
    expect(active(d).recovery).toBe("queued");
    d = send(d, { type: "advance", seconds: 30 });
    expect(active(d).recovery).toBe("sent");
    d = send(d, { type: "advance", seconds: 600 });
    expect(linked(d)).toHaveLength(1);
    expect(linked(d)[0].body).toBe(
      "Hi Morgan, from Willow & Co. Plumbing. Reply STOP to opt out.",
    );
  });
  it("requires an inbound WhatsApp service window for free-text manual replies and locks sent history", () => {
    let d = start(fixture());
    const msg = linked(d)[0];
    expect(() =>
      applyDemoCommand(d, {
        action: "saveMessage",
        data: {
          conversation_id: msg.conversation_id,
          body: "Arbitrary unapproved text",
        },
      }),
    ).toThrow("24-hour");
    d = send(d, { type: "reply", call_id: active(d).id, body: "Hello" });
    d = applyDemoCommand(d, {
      action: "saveMessage",
      data: {
        conversation_id: msg.conversation_id,
        body: "Here are our available times.",
      },
    });
    expect(linked(d).at(-1)).toMatchObject({
      direction: "outbound",
      status: "simulated",
      delivery_status: "sent",
    });
    expect(() =>
      applyDemoCommand(d, {
        action: "saveMessage",
        id: msg.id,
        data: { conversation_id: msg.conversation_id, body: "Rewrite history" },
      }),
    ).toThrow("cannot be edited");
    d = send(d, { type: "advance", seconds: 86400 });
    expect(() =>
      applyDemoCommand(d, {
        action: "saveMessage",
        data: { conversation_id: msg.conversation_id, body: "Expired window" },
      }),
    ).toThrow("24-hour");
  });
  it("does not grant permission when starting a new call for an existing demo lead", () => {
    let d = seedWorkspace(sampleBusiness);
    d = send(d, { type: "start", lead_id: d.leads[0].id });
    d = send(d, {
      type: "finish",
      call_id: active(d).id,
      outcome: "no-answer",
    });
    expect(active(d).recovery).toBe("manual");
    expect(linked(d)).toHaveLength(0);
  });
  it("links replies and wins to the selected historical call instead of the newest call", () => {
    let d = start(fixture());
    const first = active(d).id;
    d = start(d);
    const second = active(d).id;
    d = send(d, {
      type: "reply",
      call_id: first,
      body: "Regarding my first call",
    });
    d = send(d, {
      type: "book",
      call_id: first,
      title: "First visit",
      starts_at: "2026-12-12T10:00:00Z",
      ends_at: "2026-12-12T11:00:00Z",
    });
    d = send(d, { type: "won", call_id: first });
    expect(
      d.simulation!.calls.find((c) => c.id === first)?.won_at,
    ).toBeTruthy();
    expect(
      d.simulation!.calls.find((c) => c.id === second)?.replied_at,
    ).toBeNull();
  });
  it("links ordinary inbox, appointment and lead edits to recovery metrics and invalidates moved bookings", () => {
    let d = start(fixture());
    const c = active(d),
      msg = linked(d)[0];
    d = applyDemoCommand(d, {
      action: "simulateReply",
      data: {
        conversation_id: msg.conversation_id,
        body: "Please book a visit",
      },
    });
    d = applyDemoCommand(d, {
      action: "saveAppointment",
      data: {
        lead_id: c.lead_id,
        title: "Visit",
        starts_at: "2026-12-12T10:00:00Z",
        ends_at: "2026-12-12T11:00:00Z",
        status: "Scheduled",
        notes: "",
      },
    });
    const lead = d.leads.find((l) => l.id === c.lead_id)!;
    d = applyDemoCommand(d, {
      action: "saveLead",
      id: lead.id,
      data: { ...lead, status: "Won" },
    });
    expect(simulationMetrics(d).won).toBe(1);
    d = applyDemoCommand(d, {
      action: "saveLead",
      id: lead.id,
      data: { ...lead, status: "Lost" },
    });
    expect(simulationMetrics(d).won).toBe(0);
    const appt = d.appointments[0];
    d = applyDemoCommand(d, {
      action: "saveAppointment",
      id: appt.id,
      data: { ...appt, lead_id: d.leads.find((l) => l.id !== lead.id)!.id },
    });
    expect(active(d).appointment_id).toBeNull();
  });
  it("does not create a recovery for answered or unscreened voicemail calls", () => {
    for (const outcome of ["answered", "voicemail"] as const) {
      const d = start(fixture(), outcome);
      expect(simulationMetrics(d)).toMatchObject({
        answered: 1,
        missed: 0,
        attempts: 0,
      });
    }
    expect(
      simulationMetrics(start(fixture("voicemail"), "voicemail")),
    ).toMatchObject({ missed: 1, attempts: 1 });
  });
  it("groups call analytics by business timezone across year and DST boundaries", () => {
    let d = fixture();
    d.business.timezone = "Asia/Colombo";
    d.simulation!.clock = "2026-12-31T20:00:00Z";
    d = start(d);
    expect(simulationActivity(d, "Day").find((x) => x.calls === 1)?.day).toBe(
      "00:00",
    );
    expect(simulationActivity(d, "Week").at(-1)).toMatchObject({
      day: "Jan 1",
      calls: 1,
    });
    expect(simulationActivity(d, "Month")[0]).toMatchObject({
      day: "1–5",
      calls: 1,
    });
    d.business.timezone = "America/New_York";
    d.simulation!.clock = "2026-11-01T06:30:00Z";
    d.simulation!.calls[0].created_at = "2026-11-01T05:30:00Z";
    expect(simulationActivity(d, "Day")[0].calls).toBe(1);
  });
});
