"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page">
      <h1>Something interrupted the connection.</h1>
      <p>
        Please try again. For live workspaces, check Supabase configuration and
        the database migration.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
      <Link href="/demo" className="text-link">
        Explore the demo →
      </Link>
    </main>
  );
}
