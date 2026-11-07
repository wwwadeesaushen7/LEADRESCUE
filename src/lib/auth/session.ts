import { redirect } from "next/navigation";
import { isSupabaseConfigured, supabaseServer } from "@/lib/supabase/server";
export async function requireUser() {
  if (!isSupabaseConfigured()) redirect("/login");
  const db = await supabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user || !user.email_confirmed_at) redirect("/login");
  return { user, db };
}
