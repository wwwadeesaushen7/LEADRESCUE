import type { Lead } from "./model";
export function csvCell(value: string) {
  const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function leadsCsv(leads: Lead[]) {
  return [
    [
      "Name",
      "Phone",
      "Email",
      "Source",
      "Status",
      "Notes",
      "First contact",
      "Last updated",
    ],
    ...leads.map((l) => [
      l.name,
      l.phone,
      l.email,
      l.source,
      l.status,
      l.notes,
      l.created_at,
      l.updated_at,
    ]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}
