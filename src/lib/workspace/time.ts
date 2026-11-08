// Convert an explicitly chosen wall-clock time using the business timezone.
// DST gaps and repeated times are rejected instead of silently moving a booking.
export function localDateTime(iso: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (key: string) => parts.find((p) => p.type === key)!.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
export function zonedToUtc(wall: string, timezone: string): string {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(wall))
    throw new Error("Choose a valid date and time.");
  const base = new Date(wall + "Z").getTime();
  if (!Number.isFinite(base)) throw new Error("Choose a valid date and time.");
  const candidates = new Set<string>();
  // Modern IANA offsets range from -12h to +14h and use 15-minute increments.
  for (let minutes = -14 * 60; minutes <= 12 * 60; minutes += 15) {
    const iso = new Date(base + minutes * 60000).toISOString();
    if (localDateTime(iso, timezone) === wall) candidates.add(iso);
  }
  if (candidates.size === 0)
    throw new Error(
      "This local time does not exist. Choose another time (daylight saving may apply).",
    );
  if (candidates.size > 1)
    throw new Error(
      "This time occurs twice during a daylight-saving change. Choose an unambiguous time.",
    );
  return [...candidates][0];
}
export function displayTime(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
