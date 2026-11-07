"use client";
import { useState } from "react";
export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="card settings-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setMessage("");
        try {
          const r = await fetch("/api/auth/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              Object.fromEntries(new FormData(e.currentTarget)),
            ),
          });
          const result = await r.json();
          setMessage(result.message || result.error);
        } catch {
          setMessage("Could not save your profile. Try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <h2>Your profile</h2>
      <label>
        Full name
        <input
          name="fullName"
          required
          minLength={2}
          maxLength={100}
          defaultValue={name}
        />
      </label>
      <label>
        Email
        <input value={email} readOnly />
      </label>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <button className="button" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
