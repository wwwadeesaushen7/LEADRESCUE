import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { WorkspaceApp, type Section } from "./app";
import { ProfileForm } from "../profile-form";
import Link from "next/link";
export async function LiveWorkspace({ section }: { section: Section }) {
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
  let profile = "";
  if (section === "Settings") {
    const result = await db
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (result.error) throw new Error("Unable to load profile.");
    profile = result.data?.full_name || "";
  }
  return (
    <WorkspaceApp name={data.name} email={user.email} section={section}>
      {section === "Settings" && (
        <div className="profile-settings">
          <ProfileForm name={profile} email={user.email || ""} />
          <Link className="text-link" href="/forgot-password">
            Request a password reset →
          </Link>
        </div>
      )}
    </WorkspaceApp>
  );
}
