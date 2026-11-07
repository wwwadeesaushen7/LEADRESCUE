import { AuthForm } from "@/components/auth-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = { title: "Reset your password" };
export default async function Page() {
  return (
    <AuthForm mode="forgot-password" configured={isSupabaseConfigured()} />
  );
}
