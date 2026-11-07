import { NextResponse } from "next/server";
import { allowedOrigins } from "@/lib/app-origin";
export function trustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin !== null && allowedOrigins(request).includes(origin);
}
export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export async function readJson(request: Request) {
  const body = await request.text();
  if (body.length > 8192) throw new Error("Request too large.");
  return JSON.parse(body);
}
