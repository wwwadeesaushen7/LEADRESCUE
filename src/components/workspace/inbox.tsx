"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Search,
  Plus,
  MessageCircle,
  MessageSquare,
  Send,
  FlaskConical,
  Pencil,
} from "lucide-react";
import { useWorkspace } from "./provider";
import { Modal, FormError, errorText } from "./modal";
import type { Conversation } from "@/lib/workspace/model";
import { displayTime } from "@/lib/workspace/time";
export function Inbox() {
  const { data, demo, run, busy } = useWorkspace();
  const [query, setQuery] = useState(""),
    [channel, setChannel] = useState("All channels"),
    [unreadOnly, setUnreadOnly] = useState(false),
    [selected, setSelected] = useState(""),
    [creating, setCreating] = useState(false),
    [error, setError] = useState("");
  const conversations = data.conversations.filter((c) => {
    const l = data.leads.find((l) => l.id === c.lead_id);
    return (
      (!unreadOnly || c.unread) &&
      (channel === "All channels" || c.channel === channel) &&
      `${l?.name} ${l?.phone}`.toLowerCase().includes(query.toLowerCase())
    );
  });
  const current =
    conversations.find((c) => c.id === selected) || conversations[0];
  return (
    <>
      <div className="dashboard-title">
        <div>
          <span className="eyebrow">A SPACE FOR EVERY HELLO</span>
          <h1>
            Keep the conversation going<span>.</span>
          </h1>
          <p>
            {demo
              ? "Explore fictional WhatsApp and SMS conversations."
              : "Prepare your replies. Drafts stay here until messaging is connected."}
          </p>
        </div>
        <button
          className="button"
          onClick={() => setCreating(true)}
          disabled={!data.leads.length}
        >
          <Plus size={17} />
          New conversation
        </button>
      </div>
      <div className="notice inbox-notice">
        {demo
          ? "Demo conversations are simulated. No messages will be sent."
          : "Draft inbox · Saving a reply does not send a WhatsApp message or SMS."}
      </div>
      <FormError error={error} />
      <section className="card inbox-layout">
        <div className="conversation-list">
          <div className="conversation-filters">
            <label className="search-input">
              <Search size={16} />
              <input
                aria-label="Search conversations"
                placeholder="Find a customer…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Conversation channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              {["All channels", "WhatsApp", "SMS"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
              />
              Unread only
            </label>
          </div>
          {conversations.map((c) => {
            const lead = data.leads.find((l) => l.id === c.lead_id);
            const last = data.messages
              .filter((m) => m.conversation_id === c.id)
              .sort((a, b) => a.created_at.localeCompare(b.created_at))
              .at(-1);
            return (
              <button
                className={`conversation-preview ${current?.id === c.id ? "selected" : ""}`}
                key={c.id}
                onClick={() => setSelected(c.id)}
              >
                <span className="avatar lavender">
                  {lead?.name.slice(0, 2).toUpperCase()}
                </span>
                <span>
                  <strong>
                    {lead?.name}
                    {c.unread && <i className="unread-dot" />}
                  </strong>
                  <small>{last?.body || "Ready for your first draft"}</small>
                  <em>{c.channel}</em>
                </span>
              </button>
            );
          })}
          {!conversations.length && (
            <div className="empty-state">
              <MessageCircle size={26} />
              <h3>No conversations yet</h3>
              <p>
                {data.leads.length
                  ? "Start a conversation or change your filters."
                  : "Add a lead to start a conversation."}
              </p>
              {!data.leads.length && (
                <Link
                  className="text-link"
                  href={demo ? "/demo/leads" : "/leads"}
                >
                  Go to leads →
                </Link>
              )}
            </div>
          )}
        </div>
        {current ? (
          <Thread key={current.id} conversation={current} />
        ) : (
          <div className="thread-empty">
            <MessageSquare size={40} />
            <h2>A second chance to say hello.</h2>
            <p>Your conversations will feel right at home here.</p>
          </div>
        )}
      </section>
      {creating && (
        <Modal title="New conversation" onClose={() => setCreating(false)}>
          <form
            className="workspace-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              const form = new FormData(e.currentTarget);
              try {
                await run({
                  action: "createConversation",
                  data: {
                    lead_id: String(form.get("lead_id")),
                    channel: form.get("channel") as "WhatsApp" | "SMS",
                  },
                });
                setCreating(false);
                setChannel("All channels");
                setQuery("");
                setUnreadOnly(false);
                setSelected("");
              } catch (err) {
                setError(errorText(err));
              }
            }}
          >
            <label>
              Customer
              <select name="lead_id" required>
                {data.leads.map((l) => (
                  <option value={l.id} key={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Channel
              <select name="channel">
                <option>WhatsApp</option>
                <option>SMS</option>
              </select>
            </label>
            <p className="form-note">
              {demo
                ? "This creates a simulated conversation."
                : "This creates a space for drafts. No customer is contacted."}
            </p>
            <FormError error={error} />
            <button className="button" disabled={busy}>
              {busy ? "Creating…" : "Create conversation"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
function Thread({ conversation: c }: { conversation: Conversation }) {
  const { data, demo, run, busy } = useWorkspace(),
    lead = data.leads.find((l) => l.id === c.lead_id);
  const [body, setBody] = useState(""),
    [editing, setEditing] = useState<string>(),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const messages = data.messages
    .filter((m) => m.conversation_id === c.id)
    .sort(
      (a, b) =>
        a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
    );
  async function mark() {
    setError("");
    try {
      await run({
        action: "updateConversation",
        id: c.id,
        data: { unread: !c.unread, assigned_to: c.assigned_to },
      });
    } catch (e) {
      setError(errorText(e));
    }
  }
  return (
    <div className="conversation-thread">
      <div className="thread-header">
        <div>
          <h2>{lead?.name}</h2>
          <p>
            {c.channel} · {lead?.phone}
          </p>
        </div>
        <button className="text-link" disabled={busy} onClick={mark}>
          Mark {c.unread ? "read" : "unread"}
        </button>
      </div>
      <form
        className="assignment-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await run({
              action: "updateConversation",
              id: c.id,
              data: {
                unread: c.unread,
                assigned_to: String(
                  new FormData(e.currentTarget).get("assigned_to") || "",
                ),
              },
            });
            setNotice("Assignee label saved.");
          } catch (err) {
            setError(errorText(err));
          }
        }}
      >
        <label>
          Handled by
          <input
            name="assigned_to"
            defaultValue={c.assigned_to}
            maxLength={100}
            placeholder="Add a name or leave unassigned"
          />
        </label>
        <button className="text-link" disabled={busy}>
          Save assignee
        </button>
      </form>
      <div className="message-history" aria-label="Message history">
        {messages.length ? (
          messages.map((m) => (
            <article
              key={m.id}
              className={`message-bubble ${m.direction === "outbound" ? "outbound" : "inbound"}`}
            >
              <p>{m.body}</p>
              <small>
                {m.status === "draft"
                  ? "Draft · not sent"
                  : `Simulated${m.delivery_status ? " · " + m.delivery_status : ""}`}{" "}
                · {displayTime(m.created_at, data.business.timezone)}
                {m.direction === "outbound" && !m.simulation_call_id && (
                  <button
                    className="icon-button"
                    aria-label={`Edit ${m.status === "draft" ? "draft" : "message"}: ${m.body.slice(0, 35)}`}
                    onClick={() => {
                      setBody(m.body);
                      setEditing(m.id);
                      setNotice("");
                    }}
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </small>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <MessageSquare size={26} />
            <h3>Your first words go here</h3>
            <p>
              {demo
                ? "Try a message below."
                : "Write a reply and keep it as a draft."}
            </p>
          </div>
        )}
      </div>
      <form
        className="message-composer"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setNotice("");
          try {
            await run({
              action: "saveMessage",
              id: editing,
              data: { conversation_id: c.id, body },
            });
            setBody("");
            setEditing(undefined);
            setNotice(
              demo
                ? "Simulated message saved."
                : "Draft saved. Nothing was sent.",
            );
          } catch (err) {
            setError(errorText(err));
          }
        }}
      >
        {editing && (
          <div className="section-heading">
            <span>Editing a saved {demo ? "message" : "draft"}</span>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setEditing(undefined);
                setBody("");
              }}
            >
              Cancel edit
            </button>
          </div>
        )}
        <label className="sr-only" htmlFor="reply-body">
          Your reply
        </label>
        <textarea
          id="reply-body"
          placeholder={demo ? "Write a simulated reply…" : "Write a draft…"}
          rows={3}
          maxLength={1600}
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <FormError error={error} />
        {notice && (
          <p role="status" className="form-note">
            {notice}
          </p>
        )}
        <div className="composer-actions">
          <small>{body.length}/1600</small>
          {demo && (
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={async () => {
                try {
                  await run({
                    action: "simulateReply",
                    data: {
                      conversation_id: c.id,
                      body: "Thanks for getting back to me! What times do you have available?",
                    },
                  });
                  setNotice("Fictional customer reply added.");
                } catch (err) {
                  setError(errorText(err));
                }
              }}
            >
              <FlaskConical size={15} />
              Simulate reply
            </button>
          )}
          <button className="button" disabled={busy || !body.trim()}>
            <Send size={15} />
            {busy ? "Saving…" : demo ? "Save simulated reply" : "Save draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
