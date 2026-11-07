import { AuthForm } from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Log in" };
export default async function Page() {
  return <AuthForm mode="login" configured={isSupabaseConfigured()} />;
}
