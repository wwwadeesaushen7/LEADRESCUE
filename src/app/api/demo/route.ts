import { NextResponse } from "next/server";
import { businessSchema } from "@/lib/validation";
import { DEMO_COOKIE } from "@/lib/demo/session";
import { jsonError, readJson, trustedOrigin } from "@/lib/http";
export async function POST(request: Request) {
  if (!trustedOrigin(request))
    return jsonError("Request origin is not allowed.", 403);
  try {
    const parsed = businessSchema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError(parsed.error.issues[0].message);
    if (encodeURIComponent(JSON.stringify(parsed.data)).length > 3500)
      return jsonError(
        "Please shorten the description and website for this demo.",
      );
    const response = NextResponse.json({ redirect: "/demo" });
    response.cookies.set(DEMO_COOKIE, JSON.stringify(parsed.data), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400 * 7,
      path: "/",
    });
    return response;
  } catch {
    return jsonError("Please send a valid demo business form.");
  }
}
