import { AuthForm } from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Create account" };
export default async function Page() {
  return <AuthForm mode="signup" configured={isSupabaseConfigured()} />;
}
