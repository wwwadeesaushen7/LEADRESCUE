import { NextResponse } from "next/server";
import { businessSchema } from "@/lib/validation";
import { isSupabaseConfigured, supabaseServer } from "@/lib/supabase/server";
import { jsonError, readJson, trustedOrigin } from "@/lib/http";
export async function POST(request: Request) {
  if (!trustedOrigin(request))
    return jsonError("Request origin is not allowed.", 403);
  if (!isSupabaseConfigured())
    return jsonError("Supabase setup is required for a live business.", 503);
  try {
    const db = await supabaseServer();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user?.email_confirmed_at)
      return jsonError("Please sign in with a verified account.", 401);
    const parsed = businessSchema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError(parsed.error.issues[0].message);
    const { data, error } = await db.rpc("create_business", {
      input: parsed.data,
    });
    if (error)
      return jsonError(
        "Could not create the business. Check that the database migration is installed.",
        503,
      );
    return NextResponse.json(
      { id: data, redirect: "/dashboard" },
      { status: 201 },
    );
  } catch {
    return jsonError("Please send a valid business setup form.");
  }
}
