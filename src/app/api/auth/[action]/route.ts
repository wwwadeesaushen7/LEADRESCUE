import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/app-origin";
import { z } from "zod";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  credentialsSchema,
  emailSchema,
  passwordSchema,
} from "@/lib/validation";
import { jsonError, readJson, trustedOrigin } from "@/lib/http";
export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  if (!trustedOrigin(request))
    return jsonError("Request origin is not allowed.", 403);
  if (!isSupabaseConfigured())
    return jsonError(
      "Live accounts need Supabase setup. You can explore the demo now.",
      503,
    );
  const { action } = await context.params;
  try {
    const db = await supabaseServer();
    const origin = appOrigin(request);
    if (!origin) return jsonError("The app address needs configuration.", 503);
    if (action === "logout") {
      const { error } = await db.auth.signOut();
      return error
        ? jsonError("Could not sign out. Please retry.", 503)
        : NextResponse.json({ redirect: "/" });
    }
    const body = await readJson(request);
    if (action === "signup") {
      const { email, password } = credentialsSchema.parse(body);
      const { error } = await db.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (error)
        return jsonError(
          "Account creation could not be completed. Check your details or try again later.",
        );
      return NextResponse.json({
        message:
          "Check your email to verify your account. If you already have an account, sign in or reset your password.",
      });
    }
    if (action === "login") {
      const { email, password } = emailSchema
        .extend({ password: z.string().min(1).max(128) })
        .parse(body);
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user?.email_confirmed_at) {
        if (data.session) await db.auth.signOut();
        return jsonError(
          "Unable to sign in. Check your email, password, and email verification.",
          401,
        );
      }
      return NextResponse.json({ redirect: "/dashboard" });
    }
    if (action === "forgot-password") {
      const { email } = emailSchema.parse(body);
      const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });
      if (error)
        return jsonError(
          "Password recovery is temporarily unavailable. Please try again later.",
          503,
        );
      return NextResponse.json({
        message:
          "If an account exists for this email, a password reset link has been sent.",
      });
    }
    if (action === "reset-password" || action === "profile") {
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user || !user.email_confirmed_at)
        return jsonError("Sign in or open a valid recovery link first.", 401);
      if (action === "reset-password") {
        const { password } = z.object({ password: passwordSchema }).parse(body);
        const { error } = await db.auth.updateUser({ password });
        if (error)
          return jsonError(
            "Could not update your password. Open a new recovery link and try again.",
          );
        return NextResponse.json({ redirect: "/dashboard" });
      }
      const { fullName } = z
        .object({ fullName: z.string().trim().min(2).max(100) })
        .parse(body);
      const { error } = await db
        .from("profiles")
        .upsert({ id: user.id, full_name: fullName });
      return error
        ? jsonError("Could not save your profile.", 503)
        : NextResponse.json({ message: "Profile saved." });
    }
    return jsonError("Unknown action.", 404);
  } catch (error) {
    return jsonError(
      error instanceof z.ZodError
        ? error.issues[0].message
        : "We could not process that request. Please try again.",
    );
  }
}
