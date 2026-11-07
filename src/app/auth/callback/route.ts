import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/app-origin";
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = appOrigin(request);
  if (!origin)
    return NextResponse.json(
      { error: "The app address needs configuration." },
      { status: 503 },
    );
  if (isSupabaseConfigured() && url.searchParams.get("code")) {
    const db = await supabaseServer();
    const { error } = await db.auth.exchangeCodeForSession(
      url.searchParams.get("code")!,
    );
    if (!error)
      return NextResponse.redirect(
        new URL(safeNext(url.searchParams.get("next")), origin),
      );
  }
  return NextResponse.redirect(new URL("/login?error=invalid-link", origin));
}
