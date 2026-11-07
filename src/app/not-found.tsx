import Link from "next/link";
export default function Page() {
  return (
    <main id="main" className="error-page">
      <span className="eyebrow">404 · A LITTLE OFF TRACK</span>
      <h1>Let’s get you back to business.</h1>
      <p>This page could not be found.</p>
      <Link className="button" href="/">
        Back to home →
      </Link>
    </main>
  );
}
