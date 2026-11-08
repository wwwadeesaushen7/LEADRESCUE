import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured, supabaseServer } from "@/lib/supabase/server";
import { trustedOrigin, jsonError, readJson } from "@/lib/http";
import { businessSchema } from "@/lib/validation";
import {
  leadSchema,
  appointmentSchema,
  conversationSchema,
  conversationUpdateSchema,
  messageSchema,
} from "@/lib/workspace/model";
import {
  currentBusiness,
  loadWorkspace,
  dataError,
} from "@/lib/workspace/server";
const commandSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("saveLead"),
    id: z.uuid().optional(),
    data: leadSchema,
  }),
  z.object({
    action: z.literal("saveAppointment"),
    id: z.uuid().optional(),
    data: appointmentSchema,
  }),
  z.object({
    action: z.literal("createConversation"),
    data: conversationSchema,
  }),
  z.object({
    action: z.literal("updateConversation"),
    id: z.uuid(),
    data: conversationUpdateSchema,
  }),
  z.object({
    action: z.literal("saveMessage"),
    id: z.uuid().optional(),
    data: messageSchema,
  }),
  z.object({ action: z.literal("readNotifications") }),
  z.object({ action: z.literal("saveBusiness"), data: businessSchema }),
]);
async function handle(request: Request, mutate: boolean) {
  if (mutate && !trustedOrigin(request))
    return jsonError("Request origin is not allowed.", 403);
  if (!isSupabaseConfigured())
    return jsonError(
      "Sign in to a configured live account, or use the demo.",
      503,
    );
  try {
    const db = await supabaseServer();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user?.email_confirmed_at)
      return jsonError("Please sign in with a verified account.", 401);
    const business = await currentBusiness(db);
    if (!business) return jsonError("Create your business first.", 409);
    if (mutate) {
      const cmd = commandSchema.parse(await readJson(request));
      let error: unknown;
      if (cmd.action === "saveBusiness")
        ({ error } = await db.rpc("update_business", {
          target: business.id,
          input: cmd.data,
        }));
      else if (cmd.action === "readNotifications")
        ({ error } = await db
          .from("notifications")
          .update({ read: true })
          .eq("business_id", business.id));
      else if (cmd.action === "createConversation")
        ({ error } = await db
          .from("conversations")
          .insert({ ...cmd.data, business_id: business.id }));
      else if (cmd.action === "updateConversation") {
        const result = await db
          .from("conversations")
          .update(cmd.data)
          .eq("id", cmd.id)
          .eq("business_id", business.id)
          .select("id")
          .single();
        error = result.error;
      } else {
        const table =
          cmd.action === "saveLead"
            ? "leads"
            : cmd.action === "saveAppointment"
              ? "appointments"
              : "messages";
        const values =
          cmd.action === "saveMessage"
            ? { ...cmd.data, direction: "outbound", status: "draft" }
            : cmd.data;
        const result = cmd.id
          ? await db
              .from(table)
              .update(values)
              .eq("id", cmd.id)
              .eq("business_id", business.id)
              .select("id")
              .single()
          : await db
              .from(table)
              .insert({ ...values, business_id: business.id });
        error = result.error;
      }
      if (error) throw error;
    }
    return NextResponse.json(await loadWorkspace(db, business.id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError(error.issues[0].message);
    const detail = dataError(error);
    return NextResponse.json(
      { error: detail.message, code: detail.code },
      { status: detail.status },
    );
  }
}
export const GET = (request: Request) => handle(request, false);
export const POST = (request: Request) => handle(request, true);
