import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, FlaskConical, LogIn, Wifi } from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { isSupabaseConfigured, supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Open LeadRescue" };

// Installed apps start here, keeping the demo and live workspace clearly separate.
export default async function AppEntry() {
  if (isSupabaseConfigured()) {
    const db = await supabaseServer();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (user?.email_confirmed_at) redirect("/dashboard");
  }
  return (
    <>
      <header className="container onboarding-header">
        <Brand />
        <ThemeToggle />
      </header>
      <main id="main" className="app-entry container">
        <span className="eyebrow">WELCOME TO YOUR WORKSPACE</span>
        <h1>Ready when you are.</h1>
        <p>Try a sample business, or sign in to your own.</p>
        <div className="install-options">
          <Link href="/demo" className="card app-entry-choice">
            <FlaskConical size={28} />
            <h2>Explore the demo</h2>
            <p>
              Look around, personalize a sample business, and try the dashboard.
              No account or payment needed.
            </p>
            <span className="text-link">
              Open demo <ArrowUpRight size={16} />
            </span>
          </Link>
          <Link href="/login" className="card app-entry-choice">
            <LogIn size={28} />
            <h2>My business</h2>
            <p>
              Sign in to your business workspace. Live accounts need Supabase
              setup first.
            </p>
            <span className="text-link">
              Sign in <ArrowUpRight size={16} />
            </span>
          </Link>
        </div>
        <p className="install-online">
          <Wifi size={14} />
          LeadRescue needs an internet connection.
        </p>
        <Link href="/install" className="text-link">
          How to install LeadRescue <ArrowUpRight size={16} />
        </Link>
      </main>
    </>
  );
}
