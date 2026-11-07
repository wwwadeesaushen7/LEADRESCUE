"use client";
import { useState } from "react";
import { ArrowRight, Check, Building2, Clock, MapPin } from "lucide-react";
import { industries, type BusinessInput } from "@/lib/validation";
export function BusinessForm({
  demo,
  initial,
}: {
  demo: boolean;
  initial?: BusinessInput;
}) {
  const [days, setDays] = useState(initial?.workingDays || [1, 2, 3, 4, 5]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setPending(true);
    const data = {
      ...Object.fromEntries(new FormData(e.currentTarget)),
      workingDays: days,
    };
    try {
      const r = await fetch(demo ? "/api/demo" : "/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      window.location.assign(result.redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
      setPending(false);
    }
  }
  return (
    <form className="business-form card" onSubmit={submit}>
      <div className="form-section-title">
        <Building2 size={19} />
        <h2>The basics</h2>
      </div>
      <div className="form-grid">
        <label>
          Business name
          <input
            name="name"
            defaultValue={initial?.name}
            placeholder="e.g. Willow & Co. Plumbing"
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label>
          Industry
          <select
            name="industry"
            defaultValue={initial?.industry || "Plumbing"}
          >
            {industries.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </label>
        <label>
          Business phone
          <input
            type="tel"
            name="phone"
            defaultValue={initial?.phone}
            placeholder="+14155550100"
            required
            pattern="\+[1-9][0-9]{7,14}"
          />
          <small>Use international format, starting with +.</small>
        </label>
        <label>
          Business email
          <input
            type="email"
            name="email"
            defaultValue={initial?.email}
            placeholder="hello@yourbusiness.com"
            required
            maxLength={254}
          />
        </label>
        <label>
          Website <span className="optional">optional</span>
          <input
            type="url"
            name="website"
            defaultValue={initial?.website}
            placeholder="https://yourbusiness.com"
          />
        </label>
        <label>
          <span>
            <MapPin size={13} /> Business location
          </span>
          <input
            name="location"
            defaultValue={initial?.location}
            placeholder="City, state"
            required
            minLength={2}
            maxLength={200}
          />
        </label>
        <label className="span-two">
          About your business <span className="optional">optional</span>
          <textarea
            name="description"
            defaultValue={initial?.description}
            maxLength={1000}
            rows={3}
            placeholder="What do you help your customers with?"
          />
        </label>
      </div>
      <div className="form-section-title">
        <Clock size={19} />
        <h2>Your working hours</h2>
      </div>
      <label>
        Timezone
        <select
          name="timezone"
          defaultValue={initial?.timezone || "America/New_York"}
        >
          {[
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Phoenix",
            "America/Los_Angeles",
            "America/Anchorage",
            "Pacific/Honolulu",
            "Asia/Colombo",
            "Europe/London",
            "UTC",
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <fieldset className="days-field">
        <legend>Working days</legend>
        <div className="day-picker">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
            <button
              key={d}
              type="button"
              aria-pressed={days.includes(i)}
              className={days.includes(i) ? "selected" : ""}
              onClick={() =>
                setDays(
                  days.includes(i) ? days.filter((n) => n !== i) : [...days, i],
                )
              }
            >
              {days.includes(i) && <Check size={12} />} {d}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="form-grid">
        <label>
          Opening time
          <input
            name="opens"
            type="time"
            required
            defaultValue={initial?.opens || "09:00"}
          />
        </label>
        <label>
          Closing time
          <input
            name="closes"
            type="time"
            required
            defaultValue={initial?.closes || "17:00"}
          />
        </label>
      </div>
      <p className="form-note">
        These hours apply to each selected day. Overnight and per-day schedules
        are planned for Phase 2.
      </p>
      {error && (
        <div role="alert" className="notice error">
          {error}
        </div>
      )}
      <div className="form-bottom">
        <span>
          {demo
            ? "Demo only. No calls or messages will be sent."
            : "You can connect communication providers in a later phase."}
        </span>
        <button className="button" disabled={pending}>
          {pending ? "Creating…" : demo ? "Open my demo" : "Create business"}
          <ArrowRight size={17} />
        </button>
      </div>
    </form>
  );
}
