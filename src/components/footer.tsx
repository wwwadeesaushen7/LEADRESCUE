import Link from "next/link";
import { Brand } from "./brand";
export function Footer() {
  return (
    <footer className="footer container">
      <div>
        <Brand />
        <p>Never lose a customer to a missed call again.</p>
      </div>
      <div className="footer-links">
        <Link href="/#features">Features</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/demo">Explore demo</Link>
        <Link href="/login">Log in</Link>
        <Link href="/install">Get the app</Link>
      </div>
      <small>
        © {new Date().getFullYear()} LeadRescue · Development preview
      </small>
    </footer>
  );
}
