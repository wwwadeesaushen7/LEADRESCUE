"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  Users,
  CalendarDays,
  PhoneMissed,
  MessageSquare,
  CircleCheck,
  Check,
  ArrowUpRight,
  Search,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { ActivityChart } from "./activity-chart";
import { RecoveryMetrics } from "./workspace/simulator";
import { displayTime } from "@/lib/workspace/time";
import { useRouter } from "next/navigation";
import { useWorkspace } from "./workspace/provider";
import { summary } from "@/lib/workspace/model";
import { AnimatedNumber } from "./workspace/motion";
export function Dashboard({ onGuide }: { onGuide: (label: string) => void }) {
  const { data, demo, run } = useWorkspace(),
    name = data.business.name,
    counts = summary(data);
  const router = useRouter();
  const booked = new Set(
    data.appointments
      .filter((a) => a.status !== "Canceled")
      .map((a) => a.lead_id),
  ).size;
  const steps = [
    {
      title: "Create your business",
      sub: "Your own space for better follow-ups.",
      done: true,
    },
    {
      title: "Add your first lead",
      sub: "Keep customer details and notes together.",
      done: data.leads.length > 0,
    },
    {
      title: "Book an appointment",
      sub: "Make room for your next customer.",
      done: data.appointments.length > 0,
    },
    {
      title: "Prepare your first reply",
      sub: demo
        ? "Try a simulated conversation."
        : "Save an unsent draft in your inbox.",
      done: data.messages.some((m) => m.direction === "outbound"),
    },
  ];
  const completed = steps.filter((s) => s.done).length;
  const [search, setSearch] = useState("");
  const calls = demo
    ? (data.simulation?.calls || [])
        .filter((c) => c.missed)
        .map((c) => {
          const lead = data.leads.find((l) => l.id === c.lead_id)!;
          return {
            id: c.id,
            name: lead.name,
            phone: lead.phone,
            initials: lead.name.slice(0, 2),
            color: "lavender",
            channel: c.channel || "None",
            status:
              c.won_at && lead.status === "Won"
                ? "Won"
                : c.appointment_id &&
                    data.appointments.some(
                      (a) =>
                        a.id === c.appointment_id && a.status !== "Canceled",
                    )
                  ? "Booked"
                  : c.replied_at
                    ? "Replied"
                    : c.recovery[0].toUpperCase() + c.recovery.slice(1),
            time: displayTime(c.created_at, data.business.timezone),
            service: c.reason,
          };
        })
        .filter((c) =>
          `${c.name} ${c.phone} ${c.channel}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
    : [];
  const setFeature = onGuide;
  return (
    <>
      {" "}
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">YOUR BUSINESS, AT A GLANCE</span>
          <h1>
            Good things are calling<span>.</span>
          </h1>
          <p>Here’s what’s happening at {name}.</p>
        </div>
        <Link className="button" href={demo ? "/demo/settings" : "/settings"}>
          <Plus size={17} />
          {demo ? "Business settings" : "Business settings"}
        </Link>
      </div>
      <div className="stat-grid">
        {[
          {
            label: "Total leads",
            value: counts.leads,
            detail: "People in your customer list",
            icon: Users,
            color: "blue",
          },
          {
            label: "Appointments",
            value: counts.appointments,
            detail: "Scheduled and completed bookings",
            icon: CalendarDays,
            color: "peach",
          },
          {
            label: "Customer replies",
            value: counts.replies,
            detail: "Conversations moving forward",
            icon: MessageSquare,
            color: "lavender",
          },
          {
            label: "Leads won",
            value: counts.won,
            detail: "Manually marked as won",
            icon: CircleCheck,
            color: "mint",
          },
        ].map((s) => (
          <article className="card stat-card" key={s.label}>
            <div>
              <span>{s.label}</span>
              <span className={`stat-icon ${s.color}`}>
                <s.icon size={18} />
              </span>
            </div>
            <strong>
              {<AnimatedNumber value={s.value} />}
              <span>{demo ? "Demo" : "Your records"}</span>
            </strong>
            <small>{s.detail}</small>
          </article>
        ))}
      </div>
      <div className="notice simulator-notice">
        <span>
          <strong>See a missed call turn into a conversation.</strong> Try the
          recovery simulator with fictional customers.
        </span>
        <Link className="button secondary" href="/demo/simulator">
          Try recovery demo <ArrowUpRight size={15} />
        </Link>
      </div>
      {demo && <RecoveryMetrics />}
      <div className="dashboard-mid">
        <ActivityChart demo={demo} workspace={data} />
        <section className="card setup-card">
          <div className="section-heading">
            <h3>Your next steps</h3>
            <span className="tag">{completed} OF 4</span>
          </div>
          <p>A solid foundation for better follow-ups.</p>
          <div className="setup-progress">
            <span style={{ width: `${(completed / 4) * 100}%` }} />
          </div>
          {steps.map((s) => (
            <div className="checklist-item" key={s.title}>
              <span className={s.done ? "complete" : ""}>
                {s.done ? <Check size={14} /> : null}
              </span>
              <div>
                <strong>{s.title}</strong>
                <small>{s.sub}</small>
              </div>
            </div>
          ))}
          <button
            className="button secondary full"
            onClick={() => setFeature("Integration setup")}
          >
            View setup guidance <ArrowUpRight size={15} />
          </button>
        </section>
      </div>
      <section className="card calls-card">
        <div className="section-heading">
          <div>
            <h3>Recent missed calls</h3>
            <p>A new conversation could be just a reply away.</p>
          </div>
          <label className="search-input">
            <Search size={16} />
            <input
              aria-label="Search missed calls"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search calls…"
            />
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Channel</th>
                <th>Recovery status</th>
                <th>Received</th>
                <th>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="customer-cell">
                      <span className={`avatar ${c.color}`}>{c.initials}</span>
                      <div>
                        <strong>{c.name}</strong>
                        <small>{c.phone}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`channel-label ${c.channel === "WhatsApp" ? "green" : ""}`}
                    >
                      {c.channel === "WhatsApp" ? (
                        <MessageCircle size={14} />
                      ) : (
                        <MessageSquare size={14} />
                      )}{" "}
                      {c.channel}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-tag ${c.status === "Booked" ? "booked" : c.status === "Replied" ? "replied" : c.status === "Delivered" ? "delivered" : "manual"}`}
                    >
                      <i />
                      {c.status}
                    </span>
                  </td>
                  <td className="muted">{c.time}</td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`View ${c.name}`}
                      onClick={async () => {
                        try {
                          await run({
                            action: "simulation",
                            data: { type: "select", call_id: c.id },
                          });
                          router.push("/demo/simulator");
                        } catch (e) {
                          setFeature(
                            e instanceof Error
                              ? e.message
                              : "Could not open the call.",
                          );
                        }
                      }}
                    >
                      <ArrowUpRight size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {calls.length === 0 && (
            <div className="empty-state">
              <PhoneMissed size={24} />
              <h3>
                {search
                  ? "No matching calls"
                  : "A fresh start for your business"}
              </h3>
              <p>
                {search
                  ? "Try a different name, number, or channel."
                  : demo
                    ? "Start a call in the recovery demo to see its outcome here."
                    : "Your real call activity will appear once a supported telephony integration is connected."}
              </p>
            </div>
          )}
        </div>
        <div className="table-footer">
          <span>
            {demo
              ? `${data.simulation?.calls.filter((c) => c.missed).length || 0} simulated missed calls · fictional contacts`
              : "No calls recorded"}
          </span>
          <span>
            <ShieldCheck size={13} /> Consent comes first
          </span>
        </div>
      </section>
      <div className="dashboard-bottom">
        <section className="card funnel-card">
          <h3>From conversation to customer</h3>
          <p>
            {demo
              ? "Based on your demo customer list"
              : "Based on your customer list"}
          </p>
          <div className="funnel-bars">
            {[
              ["Total leads", counts.leads, 100],
              [
                "Booked leads",
                booked,
                counts.leads ? (booked / counts.leads) * 100 : 0,
              ],
              [
                "Leads won",
                counts.won,
                counts.leads ? (counts.won / counts.leads) * 100 : 0,
              ],
            ].map(([label, value, width]) => (
              <div key={label}>
                <span>{label}</span>
                <div style={{ width: `${width}%` }}>{value}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="card metrics-card">
          <h3>The details behind the day</h3>
          <div>
            {[
              [
                "Open leads",
                data.leads.filter((l) => !["Won", "Lost"].includes(l.status))
                  .length,
              ],
              ["Conversations", data.conversations.length],
              [
                "Unread conversations",
                data.conversations.filter((c) => c.unread).length,
              ],
              [
                demo ? "Simulated messages" : "Saved drafts",
                data.messages.filter((m) => m.direction === "outbound").length,
              ],
              [
                "Lead win rate",
                `${counts.leads ? Math.round((counts.won / counts.leads) * 100) : 0}%`,
              ],
            ].map(([label, value]) => (
              <p key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </p>
            ))}
          </div>
        </section>
      </div>
      <div className="workspace-footnote">
        <span>
          <ShieldCheck size={14} />{" "}
          {demo
            ? "These outcomes come from your simulated calls. A sent message is not a recovered customer."
            : "Your business data is protected by Supabase Row Level Security."}
        </span>
        <span>Made for the work you do.</span>
      </div>
    </>
  );
}
