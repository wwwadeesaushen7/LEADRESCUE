"use client";
import { useState } from "react";
import { demoActivity } from "@/lib/demo/data";
export function ActivityChart({ demo = true }: { demo?: boolean }) {
  const [period, setPeriod] = useState("Week");
  const [selected, setSelected] = useState<number | null>(null);
  const data =
    period === "Day"
      ? ["9am", "11am", "1pm", "3pm", "5pm", "7pm", "9pm"].map((day, i) => ({
          day,
          calls: [4, 8, 6, 11, 7, 3, 1][i],
          recovered: [1, 3, 2, 4, 2, 1, 0][i],
        }))
      : period === "Month"
        ? demoActivity.map((d, i) => ({
            ...d,
            day: `${i * 4 + 1} Nov`,
            calls: d.calls * 3,
            recovered: d.recovered * 3,
          }))
        : demoActivity;
  const max = period === "Month" ? 120 : period === "Day" ? 12 : 40;
  return (
    <section className="card chart-card">
      <div className="section-heading">
        <div>
          <h3>Every conversation counts</h3>
          <p>
            {demo
              ? "Illustrative activity for your demo business"
              : "Your call activity will appear here"}
          </p>
        </div>
        <div className="segmented" aria-label="Activity period">
          {["Day", "Week", "Month"].map((p) => (
            <button
              key={p}
              aria-pressed={p === period}
              className={p === period ? "active" : ""}
              onClick={() => {
                setPeriod(p);
                setSelected(null);
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-legend">
        <span>
          <i className="dot purple" />
          Incoming calls
        </span>
        <span>
          <i className="dot pale" />
          Recovery attempts
        </span>
        <small>{demo ? "Sample data" : "No integration connected"}</small>
      </div>
      <div className="chart-area">
        <div className="chart-axis">
          {[
            max,
            Math.round(max * 0.75),
            Math.round(max * 0.5),
            Math.round(max * 0.25),
            0,
          ].map((n, i) => (
            <span key={i}>{n}</span>
          ))}
        </div>
        <div className="chart-grid">
          {data.map((d, i) => (
            <button
              key={d.day}
              className={`bar-group ${selected === i ? "selected" : ""}`}
              aria-label={`${d.day}: ${demo ? d.calls : 0} calls, ${demo ? d.recovered : 0} recovery attempts`}
              onMouseEnter={() => setSelected(i)}
              onMouseLeave={() => setSelected(null)}
              onFocus={() => setSelected(i)}
              onBlur={() => setSelected(null)}
              onClick={() => setSelected(selected === i ? null : i)}
            >
              <div className="bars">
                <span
                  className="bar primary"
                  style={{ height: `${demo ? (d.calls / max) * 100 : 0}%` }}
                />
                <span
                  className="bar secondary"
                  style={{ height: `${demo ? (d.recovered / max) * 100 : 0}%` }}
                />
              </div>
              <span className="bar-label">{d.day}</span>
              {selected === i && (
                <span className="chart-tooltip">
                  {demo ? d.calls : 0} calls · {demo ? d.recovered : 0} attempts
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
