"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  CalendarDays,
  Settings,
  PhoneMissed,
  PhoneCall,
  ArrowUpRight,
  ChevronDown,
  Bell,
  Search,
  Check,
  ArrowRight,
  FlaskConical,
  Plus,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  CircleHelp,
  MessageCircle,
  CircleCheck,
  PlugZap,
  Download,
} from "lucide-react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { ActivityChart } from "./activity-chart";
import { demoCalls, metrics } from "@/lib/demo/data";
export function Dashboard({
  name,
  demo,
  email,
}: {
  name: string;
  demo: boolean;
  email?: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [search, setSearch] = useState("");
  const [feature, setFeature] = useState<string | null>(null);
  const [read, setRead] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  useEffect(() => {
    if (!feature) return;
    const previous = document.activeElement as HTMLElement | null;
    const controls =
      dialogRef.current?.querySelectorAll<HTMLButtonElement>("button");
    controls?.[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFeature(null);
      if (event.key === "Tab" && controls?.length) {
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [feature]);
  const calls = demo
    ? demoCalls.filter((c) =>
        `${c.name} ${c.phone} ${c.channel}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : [];
  async function logout() {
    try {
      const r = await fetch("/api/auth/logout", { method: "POST" });
      if (!r.ok) throw Error();
      router.push("/");
      router.refresh();
    } catch {
      setLogoutError("Sign out failed. Please retry.");
    }
  }
  return (
    <div className="workspace">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-menu"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="business-switch">
          <span className="workspace-avatar">{name.slice(0, 1)}</span>
          <div>
            <strong>{name}</strong>
            <small>{demo ? "Demo workspace" : "Business workspace"}</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <span className="nav-caption">WORKSPACE</span>
        <nav aria-label="Workspace navigation">
          <Link
            className="sidebar-link active"
            href={demo ? "/demo" : "/dashboard"}
          >
            <LayoutDashboard size={19} />
            Overview
            <span className="selected-dot" />
          </Link>
          {[
            [MessageSquare, "Inbox"],
            [Users, "Leads"],
            [CalendarDays, "Appointments"],
          ].map(([Icon, label]) => {
            const I = Icon as typeof Users;
            return (
              <button
                className="sidebar-link"
                key={String(label)}
                onClick={() => {
                  setFeature(String(label));
                  setMenu(false);
                }}
              >
                <I size={19} />
                {String(label)}
                <small>Soon</small>
              </button>
            );
          })}
          <button
            className="sidebar-link"
            onClick={() => setFeature("Automation")}
          >
            <PlugZap size={19} />
            Automations<small>Soon</small>
          </button>
          <Link
            className="sidebar-link"
            href={demo ? "/onboarding?mode=demo" : "/settings"}
          >
            <Settings size={19} />
            {demo ? "Business details" : "Settings"}
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <Link href="/install" className="sidebar-link">
            <Download size={18} />
            Install LeadRescue
          </Link>
          <div className="workspace-tip">
            <span>
              <ShieldCheck size={17} />
              Built on trust
            </span>
            <p>Every customer conversation starts with permission.</p>
            <button onClick={() => setFeature("Consent and integrations")}>
              Learn more <ArrowUpRight size={13} />
            </button>
          </div>
          <Link href="/#faq" className="sidebar-link">
            <CircleHelp size={18} />
            Help & resources
          </Link>
          <div className="profile-row">
            <span className="avatar lavender">
              {demo ? "DM" : email?.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{demo ? "Demo explorer" : "Your account"}</strong>
              <small>{demo ? "Make yourself at home" : email}</small>
            </div>
            {!demo && (
              <button
                aria-label="Log out"
                className="icon-button"
                onClick={logout}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
          {logoutError && (
            <p role="alert" className="error">
              {logoutError}
            </p>
          )}
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="workspace-body">
        <header className="workspace-header">
          <div>
            <button
              aria-label="Open navigation"
              className="icon-button mobile-menu"
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span> <strong>Overview</strong>
            </span>
          </div>
          <div className="workspace-header-actions">
            <span className={`mode-indicator ${demo ? "" : "live"}`}>
              <i />
              {demo ? "Demo mode" : "Development mode"}
            </span>
            <ThemeToggle />
            <div className="notification-wrap">
              <button
                className="icon-button notification-button"
                aria-label="Notifications"
                aria-expanded={notifications}
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
                {demo && !read && <i />}
              </button>
              {notifications && (
                <section className="notification-popover card">
                  <div className="section-heading">
                    <h3>Notifications</h3>
                    <button className="text-link" onClick={() => setRead(true)}>
                      Mark read
                    </button>
                  </div>
                  <p>
                    {demo
                      ? "Sample: Sophia has a new appointment."
                      : "You’re all caught up. Connect integrations in a later phase to receive activity notifications."}
                  </p>
                  {demo && (
                    <small>
                      Simulated notification · {read ? "Read" : "Unread"}
                    </small>
                  )}
                </section>
              )}
            </div>
            <span className="avatar lavender small-avatar">
              {demo ? "DM" : email?.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>
        <main id="main" className="dashboard-content">
          {demo && (
            <div className="demo-banner">
              <span>
                <FlaskConical size={17} />
                <strong>A little preview of what’s possible.</strong> You’re
                exploring simulated data. Nothing will be sent.
              </span>
              <Link href="/onboarding?mode=demo">
                Make it yours <ArrowRight size={15} />
              </Link>
            </div>
          )}
          <div className="dashboard-title">
            <div>
              <span className="eyebrow">YOUR BUSINESS, AT A GLANCE</span>
              <h1>
                Good things are calling<span>.</span>
              </h1>
              <p>Here’s what’s happening at {name}.</p>
            </div>
            <Link
              className="button"
              href={demo ? "/onboarding?mode=demo" : "/settings"}
            >
              <Plus size={17} />
              {demo ? "Set up demo business" : "Business settings"}
            </Link>
          </div>
          <div className="stat-grid">
            {[
              {
                label: "Total calls",
                value: 154,
                detail: "Every opportunity starts here",
                icon: PhoneCall,
                color: "blue",
              },
              {
                label: "Missed calls",
                value: 48,
                detail: "A chance to reconnect",
                icon: PhoneMissed,
                color: "peach",
              },
              {
                label: "Customer replies",
                value: 24,
                detail: "Conversations moving forward",
                icon: MessageSquare,
                color: "lavender",
              },
              {
                label: "Confirmed recovered",
                value: 8,
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
                  {demo ? s.value : 0}
                  <span>{demo ? "Sample" : "No activity yet"}</span>
                </strong>
                <small>{s.detail}</small>
              </article>
            ))}
          </div>
          <div className="dashboard-mid">
            <ActivityChart demo={demo} />
            <section className="card setup-card">
              <div className="section-heading">
                <h3>Your next steps</h3>
                <span className="tag">1 OF 4</span>
              </div>
              <p>A solid foundation for better follow-ups.</p>
              <div className="setup-progress">
                <span />
              </div>
              {[
                {
                  title: "Create your business",
                  sub: "Looking good. You’re right at home.",
                  done: true,
                },
                {
                  title: "Connect a phone number",
                  sub: "Twilio setup · planned in Phase 4",
                },
                {
                  title: "Set up your messaging",
                  sub: "WhatsApp & SMS · planned in Phase 5",
                },
                {
                  title: "Configure customer consent",
                  sub: "Required before automatic messaging",
                },
              ].map((s) => (
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
                    <tr key={c.name}>
                      <td>
                        <div className="customer-cell">
                          <span className={`avatar ${c.color}`}>
                            {c.initials}
                          </span>
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
                          onClick={() => setFeature(`${c.name}: ${c.service}`)}
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
                      : "Your real call activity will appear once a supported telephony integration is connected."}
                  </p>
                </div>
              )}
            </div>
            <div className="table-footer">
              <span>
                {demo
                  ? "4 sample calls · fictional contacts"
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
                  ? "Illustrative lead conversion"
                  : "Your lead conversion will appear here"}
              </p>
              <div className="funnel-bars">
                {[
                  ["New leads", 18, 100],
                  ["Appointments", 12, 66],
                  ["Confirmed won", 8, 44],
                ].map(([label, value, width]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <div style={{ width: `${width}%` }}>{demo ? value : 0}</div>
                  </div>
                ))}
              </div>
            </section>
            <section className="card metrics-card">
              <h3>The details behind the day</h3>
              <div>
                {metrics
                  .filter(
                    ([label]) =>
                      ![
                        "Total calls",
                        "Missed calls",
                        "Customer replies",
                        "Confirmed recovered",
                      ].includes(label),
                  )
                  .map(([label, value]) => (
                    <p key={label}>
                      <span>{label}</span>
                      <strong>{demo ? value : 0}</strong>
                    </p>
                  ))}
              </div>
            </section>
          </div>
          <div className="workspace-footnote">
            <span>
              <ShieldCheck size={14} />{" "}
              {demo
                ? "Sample outcomes illustrate the product. A sent message is not a recovered customer."
                : "Your business data is protected by Supabase Row Level Security."}
            </span>
            <span>Made for the work you do.</span>
          </div>
        </main>
      </div>
      {feature && (
        <div className="modal-backdrop" onClick={() => setFeature(null)}>
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-title"
            className="card feature-modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setFeature(null);
            }}
          >
            <button
              aria-label="Close details"
              className="icon-button modal-close"
              onClick={() => setFeature(null)}
            >
              <X size={20} />
            </button>
            <span className="feature-icon">
              <PlugZap size={25} />
            </span>
            <h2 id="feature-title">{feature}</h2>
            <p>
              This workspace is the Phase 1 foundation. The roadmap adds a
              working inbox, leads, and appointments in Phase 2, a complete
              recovery simulator in Phase 3, and Twilio integrations in Phases
              4–5.
            </p>
            <div className="notice">
              Real messaging stays disabled until sender setup, customer
              consent, and durable background processing have been implemented
              and tested.
            </div>
            <button className="button full" onClick={() => setFeature(null)}>
              Got it <Check size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
