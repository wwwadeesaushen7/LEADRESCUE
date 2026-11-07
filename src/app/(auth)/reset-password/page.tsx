import { AuthForm } from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
export const metadata = { title: "Choose a password" };
export default async function Page() {
  await requireUser();
  return <AuthForm mode="reset-password" configured={isSupabaseConfigured()} />;
}
