"use client";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
type Mode = "login" | "signup" | "forgot-password" | "reset-password";
const copy = {
  login: ["Welcome back.", "Your next opportunity is waiting.", "Log in"],
  signup: [
    "Good things start here.",
    "Make room for more conversations and more customers.",
    "Create account",
  ],
  "forgot-password": [
    "Let’s get you back in.",
    "Enter your email and we’ll send a password reset link.",
    "Send reset link",
  ],
  "reset-password": [
    "A fresh start.",
    "Choose a new password for your account.",
    "Update password",
  ],
};
function CallbackNotice() {
  const params = useSearchParams();
  return params.get("error") ? (
    <div className="notice error" role="alert">
      This link is invalid or has expired. Request a new link and open it in the
      same browser.
    </div>
  ) : null;
}
export function AuthForm({
  mode,
  configured,
}: {
  mode: Mode;
  configured: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [title, subtitle, button] = copy[mode];
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setPending(true);
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.redirect) window.location.assign(result.redirect);
      else setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <main id="main" className="auth-page">
      <aside className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow">EVERY CALL IS AN OPPORTUNITY</span>
          <h2>
            A missed call.
            <br />A new conversation.
            <br />
            <span>A better day.</span>
          </h2>
          <p>
            You take care of your customers.
            <br />
            We’ll help you keep the conversation going.
          </p>
          <div className="auth-story-note">
            <ShieldCheck size={20} />
            Built with customer permissions in mind.
          </div>
        </div>
        <small>LeadRescue · Made for small businesses</small>
      </aside>
      <section className="auth-content">
        <div className="auth-top">
          <Link href="/">← Back to home</Link>
          <ThemeToggle />
        </div>
        <div className="auth-form-wrap">
          <span className="eyebrow">
            {mode === "signup"
              ? "YOUR BUSINESS, CONNECTED"
              : "LET’S KEEP THINGS MOVING"}
          </span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <Suspense>
            <CallbackNotice />
          </Suspense>
          {!configured && (
            <div className="notice">
              <strong>Live accounts are not configured yet.</strong>
              <br />
              Connect Supabase using the README to enable authentication. The
              free demo is ready to explore.
            </div>
          )}
          <form onSubmit={submit}>
            {mode !== "reset-password" && (
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@yourbusiness.com"
                  required
                  maxLength={254}
                />
              </label>
            )}
            {mode !== "forgot-password" && (
              <label>
                Password
                <div className="password-input">
                  <input
                    name="password"
                    type={show ? "text" : "password"}
                    minLength={mode === "login" ? 1 : 12}
                    maxLength={128}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    placeholder={
                      mode === "login"
                        ? "Enter your password"
                        : "At least 12 characters"
                    }
                    required
                  />
                  <button
                    type="button"
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            )}
            {mode === "login" && (
              <Link className="forgot-link" href="/forgot-password">
                Forgot password?
              </Link>
            )}
            {error && (
              <div className="notice error" role="alert">
                {error}
              </div>
            )}
            {message && (
              <div className="notice success" role="status">
                <CheckCircle size={18} />
                {message}
              </div>
            )}
            <button className="button full" disabled={pending || !configured}>
              {pending ? "One moment…" : button}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <div className="divider">
            <span>or explore first</span>
          </div>
          <Link className="button secondary full" href="/demo">
            Try the free demo <ArrowUpRight size={17} />
          </Link>
          <p className="auth-switch">
            {mode === "login" ? (
              <>
                New to LeadRescue? <Link href="/signup">Create an account</Link>
              </>
            ) : (
              <>
                Already have an account? <Link href="/login">Log in</Link>
              </>
            )}
          </p>
          {mode === "signup" && (
            <small className="muted">
              Development preview. No payment details required. You’ll verify
              your email before setting up your business.
            </small>
          )}
        </div>
      </section>
    </main>
  );
}
