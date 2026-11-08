import type { WorkspaceData } from "@/lib/workspace/model";
import { localDateTime } from "@/lib/workspace/time";
export type ActivityPeriod = "Day" | "Week" | "Month";
// Group by business-local calendar dates; UTC day arithmetic here operates only
// on date labels, so daylight-saving transitions do not move a call to another day.
export function simulationActivity(
  data: WorkspaceData,
  period: ActivityPeriod,
) {
  const timezone = data.business.timezone,
    now = data.simulation?.clock || new Date().toISOString(),
    wall = localDateTime(now, timezone),
    today = wall.slice(0, 10),
    month = today.slice(0, 7),
    monthDays = new Date(
      Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0),
    ).getUTCDate();
  const dayAt = (offset: number) =>
    new Date(Date.parse(today + "T12:00:00Z") + offset * 86400000)
      .toISOString()
      .slice(0, 10);
  const bins =
    period === "Day"
      ? Array.from({ length: 8 }, (_, i) => ({
          key: String(i),
          day: `${String(i * 3).padStart(2, "0")}:00`,
          calls: 0,
          recovered: 0,
        }))
      : period === "Week"
        ? Array.from({ length: 7 }, (_, i) => {
            const key = dayAt(i - 6);
            return {
              key,
              day: new Intl.DateTimeFormat("en", {
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              }).format(new Date(key + "T12:00:00Z")),
              calls: 0,
              recovered: 0,
            };
          })
        : Array.from(
            {
              length: Math.ceil(monthDays / 5),
            },
            (_, i) => ({
              key: String(i),
              day: `${i * 5 + 1}–${Math.min(i * 5 + 5, monthDays)}`,
              calls: 0,
              recovered: 0,
            }),
          );
  for (const c of data.simulation?.calls || []) {
    const date = localDateTime(c.created_at, timezone);
    const key =
      period === "Day"
        ? date.slice(0, 10) === today
          ? String(Math.floor(Number(date.slice(11, 13)) / 3))
          : null
        : period === "Week"
          ? date.slice(0, 10)
          : date.slice(0, 7) === month
            ? String(Math.floor((Number(date.slice(8, 10)) - 1) / 5))
            : null;
    const bin = bins.find((b) => b.key === key);
    if (bin) {
      bin.calls++;
      if (c.message_id) bin.recovered++;
    }
  }
  return bins;
}
