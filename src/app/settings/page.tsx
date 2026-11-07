export const dynamic = "force-dynamic";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { ProfileForm } from "@/components/profile-form";
import { PublicNav } from "@/components/public-nav";
export const metadata = { title: "Account settings" };
export default async function Page() {
  const { db, user } = await requireUser();
  const { data, error } = await db
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error("Unable to load profile.");
  return (
    <>
      <PublicNav />
      <main id="main" className="container settings-page">
        <Link href="/dashboard" className="back-link">
          ← Back to dashboard
        </Link>
        <span className="eyebrow">YOUR WORKSPACE</span>
        <h1>Account settings</h1>
        <ProfileForm name={data?.full_name || ""} email={user.email || ""} />
        <div className="notice">
          Editing business details and automation settings is planned for Phase
          2. Communication providers and billing are not active.
        </div>
        <Link className="text-link" href="/forgot-password">
          Request a password reset →
        </Link>
      </main>
    </>
  );
}
