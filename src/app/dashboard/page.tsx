export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { requireUser } from "@/lib/auth/session";
export const metadata = { title: "Overview" };
export default async function Page() {
  const { db, user } = await requireUser();
  const { data, error } = await db
    .from("businesses")
    .select("id,name")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error)
    throw new Error(
      "Could not load your business. Check Supabase configuration and database migration.",
    );
  if (!data) redirect("/onboarding");
  return <Dashboard name={data.name} email={user.email} demo={false} />;
}
