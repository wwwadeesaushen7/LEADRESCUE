"use client";
import { MotionToggle } from "../motion-toggle";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  CalendarDays,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  Download,
  ShieldCheck,
  ArrowUpRight,
  PlugZap,
  FlaskConical,
  RefreshCw,
} from "lucide-react";
import { Brand } from "../brand";
import { ThemeToggle } from "../theme-toggle";
import { Dashboard } from "../dashboard";
import { BusinessForm } from "../business-form";
import { WorkspaceProvider, useWorkspace } from "./provider";
import { Leads } from "./leads";
import { Inbox } from "./inbox";
import { Appointments } from "./appointments";
import { Modal, FormError, errorText } from "./modal";
import type { BusinessInput } from "@/lib/validation";
export type Section =
  "Overview" | "Leads" | "Inbox" | "Appointments" | "Settings";
export function WorkspaceApp({
  name,
  demo = false,
  email,
  section = "Overview",
  business,
  children,
}: {
  name: string;
  demo?: boolean;
  email?: string;
  section?: Section;
  business?: BusinessInput;
  children?: React.ReactNode;
}) {
  return (
    <WorkspaceProvider demo={demo} name={name} business={business}>
      <Shell email={email} section={section}>
        {children}
      </Shell>
    </WorkspaceProvider>
  );
}
function Shell({
  email,
  section,
  children,
}: {
  email?: string;
  section: Section;
  children?: React.ReactNode;
}) {
  const { data, demo, loading, error, setupRequired, run, busy, refresh } =
      useWorkspace(),
    router = useRouter();
  const [menu, setMenu] = useState(false),
    [notifications, setNotifications] = useState(false),
    [guide, setGuide] = useState(""),
    [actionError, setActionError] = useState("");
  const name = data.business.name,
    unread = data.notifications.filter((n) => !n.read).length;
  const href = (label: Section) =>
    demo
      ? `/demo${label === "Overview" ? "" : "/" + label.toLowerCase()}`
      : label === "Overview"
        ? "/dashboard"
        : "/" + label.toLowerCase();
  async function logout() {
    try {
      const r = await fetch("/api/auth/logout", { method: "POST" });
      if (!r.ok) throw Error("Sign out failed. Please retry.");
      router.push("/");
      router.refresh();
    } catch (e) {
      setActionError(errorText(e));
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
        </div>
        <span className="nav-caption">WORKSPACE</span>
        <nav aria-label="Workspace navigation">
          {(
            [
              [LayoutDashboard, "Overview"],
              [MessageSquare, "Inbox"],
              [Users, "Leads"],
              [CalendarDays, "Appointments"],
              [Settings, "Settings"],
            ] as const
          ).map(([Icon, label]) => (
            <Link
              key={label}
              href={href(label)}
              className={`sidebar-link ${section === label ? "active" : ""}`}
              aria-current={section === label ? "page" : undefined}
              onClick={() => setMenu(false)}
            >
              <Icon size={19} />
              {label}
              {section === label && <span className="selected-dot" />}
            </Link>
          ))}
          <button
            className="sidebar-link"
            onClick={() => {
              setGuide("Automations");
              setMenu(false);
            }}
          >
            <PlugZap size={19} />
            Automations<small>Soon</small>
          </button>
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
            <button onClick={() => setGuide("Consent and integrations")}>
              Learn more <ArrowUpRight size={13} />
            </button>
          </div>
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
              Workspace <span>/</span> <strong>{section}</strong>
            </span>
          </div>
          <div className="workspace-header-actions">
            <span className="mode-indicator">
              <i />
              {demo ? "Demo mode" : "Messaging not connected"}
            </span>
            <button
              className="icon-button"
              aria-label="Refresh workspace"
              onClick={() => refresh()}
              disabled={loading || busy}
            >
              <RefreshCw size={17} className={loading ? "spin" : ""} />
            </button>
            <MotionToggle />
            <ThemeToggle />
            <div className="notification-wrap">
              <button
                className="icon-button notification-button"
                aria-label="Notifications"
                aria-expanded={notifications}
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
                {unread > 0 && <i />}
              </button>
              {notifications && (
                <section className="notification-popover card">
                  <div className="section-heading">
                    <h3>Notifications</h3>
                    <button
                      className="text-link"
                      disabled={busy || !unread}
                      onClick={async () => {
                        try {
                          await run({ action: "readNotifications" });
                        } catch (e) {
                          setActionError(errorText(e));
                        }
                      }}
                    >
                      Mark read
                    </button>
                  </div>
                  {data.notifications.length ? (
                    data.notifications.slice(0, 20).map((n) => (
                      <div
                        key={n.id}
                        className={`notice-item ${n.read ? "" : "unread"}`}
                      >
                        <p>{n.title}</p>
                        <small>
                          {n.read ? "Read" : "Unread"}
                          {demo ? " · Simulated" : ""}
                        </small>
                      </div>
                    ))
                  ) : (
                    <p>
                      You’re all caught up. New leads and appointment changes
                      will appear here.
                    </p>
                  )}
                </section>
              )}
            </div>
            <span className="avatar lavender small-avatar">
              {demo ? "DM" : email?.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>
        <main id="main" className="dashboard-content workspace-enter">
          {demo && (
            <div className="demo-banner">
              <span>
                <FlaskConical size={17} />
                <strong>A little preview of what’s possible.</strong> You’re
                exploring simulated data. Nothing will be sent.
              </span>
              <Link href="/onboarding?mode=demo">
                Make it yours <ArrowUpRight size={15} />
              </Link>
            </div>
          )}
          <FormError error={actionError} />
          {loading ? (
            <div className="workspace-skeleton" role="status">
              <span className="skeleton-line" />
              <div className="stat-grid">
                {[1, 2, 3, 4].map((n) => (
                  <div className="card skeleton-card" key={n} />
                ))}
              </div>
              <p>Opening your workspace…</p>
            </div>
          ) : error ? (
            <section className="card setup-needed">
              <h1>
                {setupRequired
                  ? "One last setup step"
                  : "Let’s reconnect your workspace"}
              </h1>
              <p>{error}</p>
              {setupRequired && (
                <p>
                  Run the new{" "}
                  <a
                    className="text-link"
                    target="_blank"
                    rel="noreferrer"
                    href="https://github.com/wwwadeesaushen7/LEADRESCUE/blob/main/supabase/migrations/0002_business_tools.sql"
                  >
                    business tools SQL script
                  </a>{" "}
                  once in your Supabase SQL Editor, then refresh here. Your
                  existing account stays in place.
                </p>
              )}
              <button className="button" onClick={() => refresh()}>
                Try again
              </button>
            </section>
          ) : section === "Overview" ? (
            <Dashboard onGuide={setGuide} />
          ) : section === "Leads" ? (
            <Leads />
          ) : section === "Inbox" ? (
            <Inbox />
          ) : section === "Appointments" ? (
            <Appointments />
          ) : (
            <>
              <div className="dashboard-title">
                <div>
                  <span className="eyebrow">MAKE IT YOURS</span>
                  <h1>
                    Business settings<span>.</span>
                  </h1>
                  <p>Your details, hours, and home timezone.</p>
                </div>
              </div>
              <BusinessForm
                initial={data.business}
                demo={demo}
                onSave={async (business) => {
                  await run({ action: "saveBusiness", data: business });
                }}
              />
              {children}
              <div className="notice">
                Automatic recovery is off. Phone and messaging integrations are
                coming in a later phase.
              </div>
            </>
          )}
        </main>
      </div>
      {guide && (
        <Modal title={guide} onClose={() => setGuide("")}>
          <span className="feature-icon">
            <PlugZap size={25} />
          </span>
          <p>
            You can manage customers, save conversation drafts, and book
            appointments now. Phone connections, automatic recovery, and real
            WhatsApp or SMS sending are coming in later phases.
          </p>
          <div className="notice">
            No messages are sent from the live inbox yet. The demo lets you try
            conversations with fictional replies.
          </div>
          <button className="button full" onClick={() => setGuide("")}>
            Got it
          </button>
        </Modal>
      )}
    </div>
  );
}
