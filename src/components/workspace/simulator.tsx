"use client";
import Link from "next/link";
import { useState } from "react";
import {
  PhoneIncoming,
  PhoneMissed,
  Check,
  ArrowRight,
  Settings2,
  Clock,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { useWorkspace } from "./provider";
import { Modal, FormError, errorText } from "./modal";
import { AnimatedNumber } from "./motion";
import {
  consentFor,
  previewMessage,
  simulationMetrics,
} from "@/lib/simulation/engine";
import {
  evaluateRecovery,
  whatsappWindowOpen,
  type CallOutcome,
} from "@/lib/recovery/policy";
import {
  scenarios,
  type ScenarioId,
  type SimulationCommand,
  type SimCall,
} from "@/lib/simulation/model";
import { displayTime, localDateTime, zonedToUtc } from "@/lib/workspace/time";

export function RecoveryMetrics() {
  const { data } = useWorkspace(),
    m = simulationMetrics(data);
  return (
    <section className="card recovery-metrics" aria-label="Recovery results">
      <div className="section-heading">
        <div>
          <h3>Your simulated results</h3>
          <p>
            All calls in this browser’s demo session. Sample inbox conversations
            are excluded.
          </p>
        </div>
        <span className="tag">SIMULATED</span>
      </div>
      <dl>
        {[
          ["Incoming calls", m.calls],
          ["Answered calls", m.answered],
          ["Missed calls", m.missed],
          ["Recovery attempts", m.attempts],
          ["WhatsApp messages", m.whatsapp],
          ["SMS messages", m.sms],
          ["Customer replies", m.replies],
          ["Unique callers", m.leads],
          ["Linked bookings", m.appointments],
          ["Confirmed recovered", m.won],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <AnimatedNumber value={Number(value)} />
            </dd>
          </div>
        ))}
      </dl>
      <p className="form-note">
        A recovery is confirmed only when you mark a lead as won after its reply
        and booking. Queued or failed messages alone never count.
      </p>
    </section>
  );
}
export function Simulator() {
  const { data, demo, run, busy } = useWorkspace();
  const [scenario, setScenario] = useState<ScenarioId>("whatsapp"),
    [error, setError] = useState(""),
    [settings, setSettings] = useState(false),
    [permissions, setPermissions] = useState(false),
    [booking, setBooking] = useState(false);
  if (!demo || !data.simulation) return null;
  const s = data.simulation,
    call = s.calls.find((c) => c.id === s.activeCallId),
    lead = data.leads.find(
      (l) => l.id === (call?.lead_id || s.prepared?.lead_id),
    );
  async function act(command: SimulationCommand) {
    setError("");
    try {
      await run({ action: "simulation", data: command });
      return true;
    } catch (e) {
      setError(errorText(e));
      return false;
    }
  }
  const consent = lead ? consentFor(data, lead.id) : null;
  return (
    <>
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">A SECOND CHANCE, IN ACTION</span>
          <h1>
            Try a little recovery<span>.</span>
          </h1>
          <p>Follow a fictional missed call all the way to a customer won.</p>
        </div>
        <button className="button secondary" onClick={() => setSettings(true)}>
          <Settings2 size={17} /> Demo settings
        </button>
      </div>
      <div className="notice simulator-notice">
        <FlaskConical size={20} />
        <span>
          <strong>A safe place to explore.</strong> Calls, permissions, and
          messages here are simulated and saved in this browser. Your business
          records stay separate.
        </span>
        <Link className="text-link" href="/dashboard">
          Back to my business <ArrowRight size={15} />
        </Link>
      </div>
      <section className="card simulator-start">
        <div>
          <h2>1. Choose a test case</h2>
          <p>
            Each case prepares a fictional customer and resets demo delivery and
            permission settings.
          </p>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await act({ type: "prepare", scenario });
          }}
        >
          <label>
            Test case
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as ScenarioId)}
            >
              {scenarios.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          </label>
          <button className="button" disabled={busy}>
            Prepare test case
          </button>
        </form>
        <p className="form-note">
          {scenarios.find((x) => x.id === scenario)?.description}
        </p>
      </section>
      <FormError error={error} />
      {lead && consent ? (
        <div className="simulator-grid">
          <section className="card simulator-customer">
            <span className="avatar lavender">
              {lead.name.slice(0, 2).toUpperCase()}
            </span>
            <h2>{lead.name}</h2>
            <p>{lead.phone}</p>
            <span className="tag">FICTIONAL CUSTOMER</span>
            <dl className="permission-summary">
              <div>
                <dt>WhatsApp permission</dt>
                <dd>{consent.whatsapp ? "Allowed" : "Not recorded"}</dd>
              </div>
              <div>
                <dt>SMS permission</dt>
                <dd>{consent.sms ? "Allowed" : "Not recorded"}</dd>
              </div>
              <div>
                <dt>Opt-out</dt>
                <dd>{consent.optedOut ? "On · both blocked" : "Off"}</dd>
              </div>
              <div>
                <dt>WhatsApp reply window</dt>
                <dd>
                  {whatsappWindowOpen(consent, s.clock) ? "Open" : "Closed"}
                </dd>
              </div>
            </dl>
            <button
              className="button secondary full"
              onClick={() => setPermissions(true)}
            >
              Edit demo permissions
            </button>
            <p className="form-note">
              <ShieldCheck size={14} /> A missed call does not give permission
              to send a message.
            </p>
          </section>
          <section
            className="card simulator-journey"
            aria-label="Recovery journey"
          >
            <CallControls
              key={`${lead.id}:${s.prepared?.key || ""}`}
              call={call}
              leadId={lead.id}
              expected={s.prepared?.outcome || "no-answer"}
              act={act}
            />
            {call && (
              <>
                <ol className="recovery-steps" aria-label="Recovery progress">
                  {[
                    ["Call finished", call.processed],
                    ["Follow-up delivered", call.recovery === "delivered"],
                    ["Customer replied", !!call.replied_at],
                    [
                      "Appointment booked",
                      data.appointments.some(
                        (a) =>
                          a.id === call.appointment_id &&
                          a.status !== "Canceled",
                      ),
                    ],
                    ["Lead won", !!call.won_at && lead.status === "Won"],
                  ].map(([label, done]) => (
                    <li key={String(label)} className={done ? "complete" : ""}>
                      <span>{done ? <Check size={13} /> : null}</span>
                      {label}
                    </li>
                  ))}
                </ol>
                <div className="recovery-result" role="status">
                  <span className="tag">{call.recovery.toUpperCase()}</span>
                  <p>{call.reason}</p>
                  {call.duplicate_count > 0 && (
                    <p>
                      <strong>
                        {call.duplicate_count} duplicate event
                        {call.duplicate_count === 1 ? "" : "s"} ignored.
                      </strong>{" "}
                      Still one automatic attempt for this call.
                    </p>
                  )}
                </div>
                {call.message_id && (
                  <article className="simulation-message">
                    <span>
                      {call.channel} ·{" "}
                      {call.format === "template"
                        ? "Approved demo template"
                        : call.format === "freeform"
                          ? "Within the reply window"
                          : "SMS"}{" "}
                      · {call.recovery}
                    </span>
                    <p>
                      {
                        data.messages.find((m) => m.id === call.message_id)
                          ?.body
                      }
                    </p>
                  </article>
                )}
                {call.recovery === "queued" && (
                  <div className="simulator-actions">
                    <p>
                      <Clock size={15} /> Waiting until{" "}
                      {displayTime(call.due_at!, data.business.timezone)} on the
                      demo clock.
                    </p>
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() =>
                        act({
                          type: "advance",
                          seconds: Math.max(
                            1,
                            Math.ceil(
                              (Date.parse(call.due_at!) - Date.parse(s.clock)) /
                                1000,
                            ),
                          ),
                        })
                      }
                    >
                      Advance to send time
                    </button>
                  </div>
                )}
                {call.recovery === "sent" && (
                  <div className="simulator-actions">
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() =>
                        act({
                          type: "delivery",
                          call_id: call.id,
                          status: "delivered",
                        })
                      }
                    >
                      Simulate delivery
                    </button>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() =>
                        act({
                          type: "delivery",
                          call_id: call.id,
                          status: "failed",
                        })
                      }
                    >
                      Simulate delivery failure
                    </button>
                  </div>
                )}
                {["sent", "delivered"].includes(call.recovery) && (
                  <form
                    className="workspace-form simulation-reply"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      if (
                        await act({
                          type: "reply",
                          call_id: call.id,
                          body: String(new FormData(form).get("body")),
                        })
                      )
                        form.reset();
                    }}
                  >
                    <label>
                      Customer’s simulated reply
                      <textarea
                        name="body"
                        rows={2}
                        required
                        maxLength={1600}
                        defaultValue="Thanks! Can I book a repair this week?"
                      />
                    </label>
                    <div className="simulator-actions">
                      <button className="button" disabled={busy}>
                        Simulate customer reply
                      </button>
                      <button
                        type="button"
                        className="button secondary"
                        disabled={busy || consent.optedOut}
                        onClick={() =>
                          act({ type: "reply", call_id: call.id, body: "STOP" })
                        }
                      >
                        Simulate STOP
                      </button>
                    </div>
                  </form>
                )}
                {call.replied_at && (
                  <div className="simulator-actions">
                    <Link className="button secondary" href="/demo/inbox">
                      Open demo inbox <ArrowRight size={15} />
                    </Link>
                    <button
                      className="button secondary"
                      disabled={
                        busy ||
                        data.appointments.some(
                          (a) =>
                            a.id === call.appointment_id &&
                            a.status !== "Canceled",
                        )
                      }
                      onClick={() => setBooking(true)}
                    >
                      Book demo appointment
                    </button>
                    <button
                      className="button"
                      disabled={
                        busy ||
                        !data.appointments.some(
                          (a) =>
                            a.id === call.appointment_id &&
                            a.status !== "Canceled",
                        ) ||
                        (!!call.won_at && lead.status === "Won")
                      }
                      onClick={() => act({ type: "won", call_id: call.id })}
                    >
                      {call.won_at && lead.status === "Won"
                        ? "Recovery confirmed"
                        : "Mark lead as won"}
                    </button>
                  </div>
                )}
                {call.processed && (
                  <div className="simulator-replay">
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => act({ type: "process", call_id: call.id })}
                    >
                      Replay duplicate call event
                    </button>
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => act({ type: "start", lead_id: lead.id })}
                    >
                      Start another call
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      ) : (
        <section className="card simulator-empty">
          <PhoneIncoming size={32} />
          <h2>Ready when you are.</h2>
          <p>
            Prepare the WhatsApp recovery case above to try your first missed
            call.
          </p>
        </section>
      )}
      <RecoveryMetrics />
      <section className="card simulator-history">
        <div className="section-heading">
          <div>
            <h3>What happened, and why</h3>
            <p>Follow the decisions behind each simulated call.</p>
          </div>
          <span className="tag">{s.calls.length} CALLS</span>
        </div>
        <div className="simulator-history-grid">
          <div className="simulator-call-list" aria-label="Simulated calls">
            {s.calls.length ? (
              s.calls.map((c) => (
                <button
                  key={c.id}
                  className={`simulation-call ${c.id === call?.id ? "selected" : ""}`}
                  disabled={busy}
                  onClick={() => act({ type: "select", call_id: c.id })}
                >
                  <PhoneMissed size={17} />
                  <span>
                    <strong>
                      {data.leads.find((l) => l.id === c.lead_id)?.name}
                    </strong>
                    <small>
                      {c.outcome} · {c.recovery}
                    </small>
                    <small>
                      {displayTime(c.created_at, data.business.timezone)}
                    </small>
                  </span>
                </button>
              ))
            ) : (
              <p>No calls yet.</p>
            )}
          </div>
          <ol className="simulation-log" aria-label="Simulation event log">
            {s.log
              .filter((x) => !call || x.call_id === call.id || !x.call_id)
              .slice(0, 60)
              .map((x) => (
                <li key={x.id}>
                  <p>{x.text}</p>
                  <time>{displayTime(x.at, data.business.timezone)}</time>
                </li>
              ))}
            {!s.log.length && <li>Events will appear as you explore.</li>}
          </ol>
        </div>
      </section>
      <div className="simulation-clock">
        <span>
          <Clock size={15} /> Demo clock:{" "}
          {displayTime(s.clock, data.business.timezone)} ·{" "}
          {data.business.timezone}
        </span>
        <button
          className="text-link"
          disabled={busy}
          onClick={() => act({ type: "advance", seconds: 86400 })}
        >
          Advance 24 hours
        </button>
      </div>
      <p className="form-note">
        Time moves when you choose an action. Advance the clock to test delays
        and expiring reply windows.{" "}
        <Link className="text-link" href="/demo">
          View demo dashboard →
        </Link>
      </p>
      {settings && (
        <SettingsForm onClose={() => setSettings(false)} act={act} />
      )}
      {permissions && lead && (
        <PermissionsForm
          leadId={lead.id}
          onClose={() => setPermissions(false)}
          act={act}
        />
      )}
      {booking && call && (
        <BookingForm call={call} onClose={() => setBooking(false)} act={act} />
      )}
    </>
  );
}
type Action = (cmd: SimulationCommand) => Promise<boolean>;
function CallControls({
  call,
  leadId,
  expected,
  act,
}: {
  call?: SimCall;
  leadId: string;
  expected: Exclude<CallOutcome, "ringing">;
  act: Action;
}) {
  const { data, busy } = useWorkspace(),
    s = data.simulation!;
  const [outcome, setOutcome] =
    useState<Exclude<CallOutcome, "ringing">>(expected);
  const decision = evaluateRecovery(
    outcome,
    {
      ...s.settings,
      screenVoicemail: call?.screened ?? s.settings.screenVoicemail,
    },
    consentFor(data, leadId),
    s.clock,
  );
  return (
    <>
      <div className="section-heading">
        <h2>2. Follow the call</h2>
        <span
          className={`call-orb ${call?.outcome === "ringing" ? "ringing" : ""}`}
        >
          <PhoneIncoming size={22} />
        </span>
      </div>
      {!call || call.outcome === "ringing" ? (
        <>
          <p>
            {call
              ? "The demo phone is ringing. Choose how the call ends."
              : "Preview the follow-up, then start your simulated call."}
          </p>
          <label className="simulation-outcome">
            Call outcome
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as typeof outcome)}
            >
              {[
                ["no-answer", "Not answered"],
                ["answered", "Answered by the business"],
                ["busy", "Line busy"],
                ["failed", "Call failed"],
                ["canceled", "Caller canceled"],
                ["voicemail", "Voicemail answered"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="recovery-preview">
            <strong>
              {decision.kind === "send"
                ? `${decision.channel} follow-up preview`
                : decision.kind === "manual"
                  ? "Manual review needed"
                  : "No automatic follow-up"}
            </strong>
            <p>{decision.reason}</p>
            {decision.kind === "send" && (
              <blockquote>
                {previewMessage(data, leadId, decision.channel)}
              </blockquote>
            )}
          </div>
          <button
            className="button"
            disabled={busy}
            onClick={() =>
              act(
                call
                  ? { type: "finish", call_id: call.id, outcome }
                  : { type: "start", lead_id: leadId },
              )
            }
          >
            {call ? "Finish simulated call" : "Start incoming call"}{" "}
            <ArrowRight size={16} />
          </button>
        </>
      ) : (
        <p>
          Call finished: <strong>{call.outcome}</strong>. Continue below to try
          the next step.
        </p>
      )}
    </>
  );
}
function Toggle({
  name,
  label,
  checked,
}: {
  name: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="checkbox-label">
      <input name={name} type="checkbox" defaultChecked={checked} />
      {label}
    </label>
  );
}
function SettingsForm({ act, onClose }: { act: Action; onClose: () => void }) {
  const { data, busy } = useWorkspace(),
    s = data.simulation!.settings;
  const [error, setError] = useState("");
  return (
    <Modal title="Demo recovery settings" onClose={onClose}>
      <form
        className="workspace-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget),
            on = (key: string) => f.get(key) === "on";
          if (
            await act({
              type: "settings",
              data: {
                enabled: on("enabled"),
                mode: f.get("mode") as typeof s.mode,
                whatsappReady: on("whatsappReady"),
                approvedTemplate: on("approvedTemplate"),
                smsReady: on("smsReady"),
                smsRegistered: on("smsRegistered"),
                delaySeconds: Number(f.get("delaySeconds")),
                screenVoicemail: on("screenVoicemail"),
                whatsappText: String(f.get("whatsappText")),
                smsText: String(f.get("smsText")),
              },
            })
          )
            onClose();
          else
            setError(
              "Could not save. Check your message text and delay (0–3600 seconds).",
            );
        }}
      >
        <p className="form-note">
          These switches represent fictional sender readiness. They do not
          connect a provider.
        </p>
        <Toggle
          name="enabled"
          label="Enable simulated recovery"
          checked={s.enabled}
        />
        <div className="form-grid">
          <label>
            Messaging mode
            <select name="mode" defaultValue={s.mode}>
              <option value="both">
                WhatsApp first, eligible SMS fallback
              </option>
              <option value="whatsapp">WhatsApp only</option>
              <option value="sms">SMS only</option>
            </select>
          </label>
          <label>
            Delay in seconds
            <input
              type="number"
              name="delaySeconds"
              min="0"
              max="3600"
              step="1"
              required
              defaultValue={s.delaySeconds}
            />
          </label>
        </div>
        <Toggle
          name="whatsappReady"
          label="WhatsApp sender ready"
          checked={s.whatsappReady}
        />
        <Toggle
          name="approvedTemplate"
          label="Approved WhatsApp template available"
          checked={s.approvedTemplate}
        />
        <Toggle name="smsReady" label="SMS sender ready" checked={s.smsReady} />
        <Toggle
          name="smsRegistered"
          label="Required SMS registration completed"
          checked={s.smsRegistered}
        />
        <Toggle
          name="screenVoicemail"
          label="Screen calls to distinguish voicemail"
          checked={s.screenVoicemail}
        />
        <label>
          WhatsApp demo message
          <textarea
            name="whatsappText"
            required
            maxLength={600}
            rows={3}
            defaultValue={s.whatsappText}
          />
        </label>
        <label>
          SMS demo message
          <textarea
            name="smsText"
            required
            maxLength={600}
            rows={3}
            defaultValue={s.smsText}
          />
        </label>
        <p className="form-note">
          Use {"{{customer}}"} and {"{{business}}"} for names. SMS includes an
          opt-out instruction. Edited demo text is never submitted for real
          template approval.
        </p>
        <FormError error={error} />
        <button className="button" disabled={busy}>
          Save demo settings
        </button>
      </form>
    </Modal>
  );
}
function PermissionsForm({
  leadId,
  act,
  onClose,
}: {
  leadId: string;
  act: Action;
  onClose: () => void;
}) {
  const { data, busy } = useWorkspace(),
    consent = consentFor(data, leadId);
  return (
    <Modal title="Fictional customer permissions" onClose={onClose}>
      <form
        className="workspace-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget),
            on = (key: string) => f.get(key) === "on";
          if (
            await act({
              type: "permissions",
              lead_id: leadId,
              data: {
                whatsapp: on("whatsapp"),
                sms: on("sms"),
                optedOut: on("optedOut"),
                windowOpen: on("windowOpen"),
              },
            })
          )
            onClose();
        }}
      >
        <p className="form-note">
          Use these demo switches to test eligibility. They do not record
          consent for real customers. An opt-out blocks both channels even if
          permission is checked.
        </p>
        <Toggle
          name="whatsapp"
          label="WhatsApp permission recorded"
          checked={consent.whatsapp}
        />
        <Toggle
          name="sms"
          label="Separate SMS permission recorded"
          checked={consent.sms}
        />
        <Toggle
          name="optedOut"
          label="Customer has opted out"
          checked={consent.optedOut}
        />
        <Toggle
          name="windowOpen"
          label="Customer sent a WhatsApp message just now"
          checked={whatsappWindowOpen(consent, data.simulation!.clock)}
        />
        <button className="button" disabled={busy}>
          Save demo permissions
        </button>
      </form>
    </Modal>
  );
}
function BookingForm({
  call,
  act,
  onClose,
}: {
  call: SimCall;
  act: Action;
  onClose: () => void;
}) {
  const { data, busy } = useWorkspace(),
    [error, setError] = useState("");
  const start = Date.parse(data.simulation!.clock) + 86400000 * 2;
  return (
    <Modal title="Book a demo appointment" onClose={onClose}>
      <form
        className="workspace-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const f = new FormData(e.currentTarget);
          try {
            const ok = await act({
              type: "book",
              call_id: call.id,
              title: String(f.get("title")),
              starts_at: zonedToUtc(
                String(f.get("starts")),
                data.business.timezone,
              ),
              ends_at: zonedToUtc(
                String(f.get("ends")),
                data.business.timezone,
              ),
            });
            if (ok) onClose();
            else
              setError(
                "Could not save. Check that the end follows the start and the time does not overlap another booking.",
              );
          } catch (err) {
            setError(errorText(err));
          }
        }}
      >
        <p>
          For {data.leads.find((l) => l.id === call.lead_id)?.name}. Times are
          in {data.business.timezone}.
        </p>
        <label>
          Appointment title
          <input
            name="title"
            required
            minLength={2}
            maxLength={150}
            defaultValue="Repair consultation"
          />
        </label>
        <div className="form-grid">
          <label>
            Starts at
            <input
              name="starts"
              type="datetime-local"
              required
              defaultValue={localDateTime(
                new Date(start).toISOString(),
                data.business.timezone,
              )}
            />
          </label>
          <label>
            Ends at
            <input
              name="ends"
              type="datetime-local"
              required
              defaultValue={localDateTime(
                new Date(start + 3600000).toISOString(),
                data.business.timezone,
              )}
            />
          </label>
        </div>
        <FormError error={error} />
        <button className="button" disabled={busy}>
          Save demo appointment
        </button>
      </form>
    </Modal>
  );
}
