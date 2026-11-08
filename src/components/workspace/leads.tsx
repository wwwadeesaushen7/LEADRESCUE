"use client";
import { useState } from "react";
import { Plus, Search, Download, Users, ArrowUpRight } from "lucide-react";
import { useWorkspace } from "./provider";
import { Modal, FormError, errorText } from "./modal";
import { leadSchema, leadStatuses, type Lead } from "@/lib/workspace/model";
import { leadsCsv } from "@/lib/workspace/csv";
import { displayTime } from "@/lib/workspace/time";
export function Leads() {
  const { data } = useWorkspace();
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("All statuses"),
    [edit, setEdit] = useState<Lead | null | undefined>(),
    [page, setPage] = useState(0);
  const filtered = data.leads.filter(
    (l) =>
      (status === "All statuses" || l.status === status) &&
      `${l.name} ${l.phone} ${l.email} ${l.notes}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / 20) - 1),
  );
  function download() {
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + leadsCsv(filtered)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "leadrescue-leads.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">PEOPLE, NOT JUST NUMBERS</span>
          <h1>
            A little connection<span>.</span>
          </h1>
          <p>
            Keep every opportunity close, from first hello to a happy customer.
          </p>
        </div>
        <button className="button" onClick={() => setEdit(null)}>
          <Plus size={17} />
          Add lead
        </button>
      </div>
      <div className="pipeline-strip" aria-label="Lead status filters">
        {leadStatuses.map((s) => (
          <button
            key={s}
            className={status === s ? "selected" : ""}
            aria-pressed={status === s}
            onClick={() => {
              setStatus(status === s ? "All statuses" : s);
              setPage(0);
            }}
          >
            <span>{s}</span>
            <strong>{data.leads.filter((l) => l.status === s).length}</strong>
          </button>
        ))}
      </div>
      <section className="card records-card">
        <div className="records-toolbar">
          <label className="search-input">
            <Search size={16} />
            <input
              aria-label="Search leads"
              placeholder="Search name, phone, or notes…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <select
            aria-label="Filter lead status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            {["All statuses", ...leadStatuses].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            className="button secondary"
            disabled={!filtered.length}
            onClick={download}
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Status</th>
                <th>Source</th>
                <th>Added</th>
                <th>
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice(currentPage * 20, currentPage * 20 + 20)
                .map((l) => (
                  <tr key={l.id}>
                    <td>
                      <button
                        className="customer-cell customer-button"
                        onClick={() => setEdit(l)}
                      >
                        <span className="avatar lavender">
                          {l.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span>
                          <strong>{l.name}</strong>
                          <small>{l.phone}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <span
                        className={`status-tag ${l.status === "Won" ? "booked" : l.status === "Lost" ? "manual" : "replied"}`}
                      >
                        <i />
                        {l.status}
                      </span>
                    </td>
                    <td>{l.source}</td>
                    <td className="muted">
                      {displayTime(l.created_at, data.business.timezone)}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`Edit ${l.name}`}
                        onClick={() => setEdit(l)}
                      >
                        <ArrowUpRight size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="empty-state">
            <Users size={30} />
            <h3>
              {query || status !== "All statuses"
                ? "No matching leads"
                : "Your next customer starts here"}
            </h3>
            <p>
              {data.leads.length
                ? "Try another search or status."
                : "Add your first customer to start organizing conversations and appointments."}
            </p>
          </div>
        )}
        <div className="table-footer">
          <span>
            {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
            {status !== "All statuses" ? ` · ${status}` : ""}
          </span>
          <div className="pagination">
            <button
              className="text-link"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </button>
            <span>
              {currentPage + 1} / {Math.max(1, Math.ceil(filtered.length / 20))}
            </span>
            <button
              className="text-link"
              disabled={(currentPage + 1) * 20 >= filtered.length}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
      {edit !== undefined && (
        <LeadEditor lead={edit} onClose={() => setEdit(undefined)} />
      )}
    </>
  );
}
function LeadEditor({
  lead,
  onClose,
}: {
  lead: Lead | null;
  onClose: () => void;
}) {
  const { run, busy, data } = useWorkspace(),
    [error, setError] = useState("");
  return (
    <Modal
      title={lead ? "Customer details" : "Add a new lead"}
      onClose={onClose}
    >
      <form
        className="workspace-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await run({
              action: "saveLead",
              id: lead?.id,
              data: leadSchema.parse(
                Object.fromEntries(new FormData(e.currentTarget)),
              ),
            });
            onClose();
          } catch (err) {
            setError(errorText(err));
          }
        }}
      >
        <div className="form-grid">
          <label>
            Customer name
            <input
              name="name"
              required
              minLength={2}
              maxLength={100}
              defaultValue={lead?.name}
            />
          </label>
          <label>
            Phone number
            <input
              name="phone"
              aria-label="Phone number"
              aria-describedby="lead-phone-hint"
              type="tel"
              placeholder="+14155550100"
              required
              pattern="\+[1-9][0-9]{7,14}"
              defaultValue={lead?.phone}
            />
            <small id="lead-phone-hint">
              Include the country code, starting with +.
            </small>
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              maxLength={254}
              defaultValue={lead?.email}
            />
          </label>
          <label>
            Source
            <select name="source" defaultValue={lead?.source || "Manual"}>
              {[
                "Manual",
                "Phone",
                "WhatsApp",
                "SMS",
                "Website",
                "Referral",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="span-two">
            Lead status
            <select name="status" defaultValue={lead?.status || "New"}>
              {leadStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="span-two">
            Customer notes
            <textarea
              name="notes"
              rows={4}
              maxLength={4000}
              placeholder="What would help you remember this customer?"
              defaultValue={lead?.notes}
            />
          </label>
        </div>
        {lead && (
          <small className="muted">
            Added {displayTime(lead.created_at, data.business.timezone)} ·
            Updated {displayTime(lead.updated_at, data.business.timezone)}
          </small>
        )}
        <FormError error={error} />
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Save lead"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
