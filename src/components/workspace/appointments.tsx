"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
} from "lucide-react";
import { useWorkspace } from "./provider";
import { Modal, FormError, errorText } from "./modal";
import {
  appointmentSchema,
  appointmentStatuses,
  type Appointment,
} from "@/lib/workspace/model";
import { localDateTime, zonedToUtc, displayTime } from "@/lib/workspace/time";
export function Appointments() {
  const { data, demo } = useWorkspace(),
    tz = data.business.timezone,
    today = localDateTime(new Date().toISOString(), tz).slice(0, 10);
  const [month, setMonth] = useState(today.slice(0, 7)),
    [day, setDay] = useState(""),
    [status, setStatus] = useState("All statuses"),
    [edit, setEdit] = useState<Appointment | null | undefined>();
  const [year, mo] = month.split("-").map(Number),
    first = new Date(Date.UTC(year, mo - 1, 1)),
    days = new Date(Date.UTC(year, mo, 0)).getUTCDate();
  const inMonth = data.appointments.filter((a) =>
    localDateTime(a.starts_at, tz).startsWith(month),
  );
  const filtered = inMonth
    .filter(
      (a) =>
        (!day || localDateTime(a.starts_at, tz).startsWith(day)) &&
        (status === "All statuses" || a.status === status),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  function move(offset: number) {
    const d = new Date(Date.UTC(year, mo - 1 + offset, 1));
    setMonth(d.toISOString().slice(0, 7));
    setDay("");
  }
  return (
    <>
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">MAKE TIME FOR GOOD THINGS</span>
          <h1>
            Something to look forward to<span>.</span>
          </h1>
          <p>
            One shared business calendar. All times in {tz.replaceAll("_", " ")}
            .
          </p>
        </div>
        <button
          className="button"
          onClick={() => setEdit(null)}
          disabled={!data.leads.length}
        >
          <Plus size={17} />
          Book appointment
        </button>
      </div>
      {!data.leads.length && (
        <div className="notice">
          Add a customer before creating a booking.{" "}
          <Link className="text-link" href={demo ? "/demo/leads" : "/leads"}>
            Go to leads →
          </Link>
        </div>
      )}
      <div className="calendar-layout">
        <section className="card calendar-card">
          <div className="section-heading">
            <h2>
              {new Intl.DateTimeFormat("en", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(first)}
            </h2>
            <div className="calendar-controls">
              <button
                className="icon-button"
                aria-label="Previous month"
                onClick={() => move(-1)}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="text-link"
                onClick={() => {
                  setMonth(today.slice(0, 7));
                  setDay(today);
                }}
              >
                Today
              </button>
              <button
                className="icon-button"
                aria-label="Next month"
                onClick={() => move(1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span className="calendar-weekday" key={d}>
                {d}
              </span>
            ))}
            {Array.from({ length: first.getUTCDay() }, (_, i) => (
              <span key={"empty" + i} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date = `${month}-${String(i + 1).padStart(2, "0")}`,
                bookings = inMonth.filter(
                  (a) =>
                    localDateTime(a.starts_at, tz).startsWith(date) &&
                    a.status !== "Canceled",
                );
              return (
                <button
                  key={date}
                  aria-label={`${date}, ${bookings.length} appointments`}
                  aria-pressed={day === date}
                  className={`calendar-day ${date === today ? "today" : ""} ${date === day ? "selected" : ""}`}
                  onClick={() => setDay(day === date ? "" : date)}
                >
                  <span>{i + 1}</span>
                  {bookings.length > 0 && (
                    <span className="calendar-marker">
                      <i />
                      <small>{bookings.length}</small>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="form-note">
            Select a day to see its appointments. Select it again to show the
            whole month.
          </p>
        </section>
        <section className="card appointment-list">
          <div className="section-heading">
            <h2>{day ? day : "This month"}</h2>
            <select
              aria-label="Filter appointments"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {["All statuses", ...appointmentStatuses].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          {filtered.map((a) => (
            <button
              className="appointment-item"
              key={a.id}
              onClick={() => setEdit(a)}
            >
              <span className="appointment-icon">
                <CalendarDays size={20} />
              </span>
              <span>
                <strong>{a.title}</strong>
                <small>
                  {data.leads.find((l) => l.id === a.lead_id)?.name}
                </small>
                <span className="appointment-time">
                  <Clock size={12} />
                  {displayTime(a.starts_at, tz)} –{" "}
                  {new Intl.DateTimeFormat("en", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: tz,
                  }).format(new Date(a.ends_at))}
                </span>
                <span
                  className={`status-tag ${a.status === "Completed" ? "booked" : a.status === "Canceled" ? "manual" : "replied"}`}
                >
                  {a.status}
                </span>
              </span>
            </button>
          ))}
          {!filtered.length && (
            <div className="empty-state">
              <CalendarDays size={30} />
              <h3>A little room in your day</h3>
              <p>No appointments match this view.</p>
            </div>
          )}
        </section>
      </div>
      {edit !== undefined && (
        <AppointmentEditor
          appointment={edit}
          date={day || today}
          onClose={() => setEdit(undefined)}
        />
      )}
    </>
  );
}
function AppointmentEditor({
  appointment: a,
  date,
  onClose,
}: {
  appointment: Appointment | null;
  date: string;
  onClose: () => void;
}) {
  const { data, run, busy } = useWorkspace(),
    tz = data.business.timezone,
    [error, setError] = useState("");
  return (
    <Modal
      title={a ? "Appointment details" : "Book an appointment"}
      onClose={onClose}
    >
      <form
        className="workspace-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const values = Object.fromEntries(new FormData(e.currentTarget));
          try {
            await run({
              action: "saveAppointment",
              id: a?.id,
              data: appointmentSchema.parse({
                ...values,
                starts_at: zonedToUtc(String(values.starts_at), tz),
                ends_at: zonedToUtc(String(values.ends_at), tz),
              }),
            });
            onClose();
          } catch (err) {
            setError(errorText(err));
          }
        }}
      >
        <div className="form-grid">
          <label className="span-two">
            Appointment title
            <input
              name="title"
              required
              minLength={2}
              maxLength={150}
              defaultValue={a?.title}
              placeholder="e.g. Kitchen faucet repair"
            />
          </label>
          <label>
            Customer
            <select name="lead_id" required defaultValue={a?.lead_id}>
              {data.leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Appointment status
            <select name="status" defaultValue={a?.status || "Scheduled"}>
              {appointmentStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Starts at
            <input
              type="datetime-local"
              name="starts_at"
              required
              defaultValue={
                a ? localDateTime(a.starts_at, tz) : date + "T09:00"
              }
            />
          </label>
          <label>
            Ends at
            <input
              type="datetime-local"
              name="ends_at"
              required
              defaultValue={a ? localDateTime(a.ends_at, tz) : date + "T10:00"}
            />
          </label>
          <label className="span-two">
            Appointment notes
            <textarea
              name="notes"
              rows={3}
              maxLength={2000}
              defaultValue={a?.notes}
            />
          </label>
        </div>
        <p className="form-note">
          Times are in {tz}. Scheduled appointments cannot overlap. Saving does
          not send a confirmation to the customer.
        </p>
        <FormError error={error} />
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Save appointment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
