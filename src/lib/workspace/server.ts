import { supabaseServer } from "@/lib/supabase/server";
import type { WorkspaceData } from "./model";
import type { BusinessInput } from "@/lib/validation";
export type Db = Awaited<ReturnType<typeof supabaseServer>>;
export async function currentBusiness(db: Db) {
  const { data, error } = await db
    .from("businesses")
    .select("*")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
export async function loadWorkspace(
  db: Db,
  businessId: string,
): Promise<WorkspaceData> {
  const [businessResult, settingsResult] = await Promise.all([
    db.from("businesses").select("*").eq("id", businessId).single(),
    db
      .from("business_settings")
      .select("*")
      .eq("business_id", businessId)
      .single(),
  ]);
  if (businessResult.error) throw businessResult.error;
  if (settingsResult.error) throw settingsResult.error;
  const b = businessResult.data,
    s = settingsResult.data;
  const business: BusinessInput = {
    name: b.name,
    industry: b.industry,
    phone: b.phone,
    email: b.email,
    location: b.location,
    timezone: b.timezone,
    website: b.website,
    description: b.description,
    opens: s.opens.slice(0, 5),
    closes: s.closes.slice(0, 5),
    workingDays: s.working_days,
  };
  async function all(table: string) {
    const rows: Record<string, unknown>[] = [];
    for (let start = 0; start < 10000; start += 1000) {
      const { data, error } = await db
        .from(table)
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .order("id")
        .range(start, start + 999);
      if (error) throw error;
      rows.push(...data);
      if (data.length < 1000) return rows;
    }
    throw new Error("Workspace exceeds the current 10,000-record view limit.");
  }
  const [leads, appointments, conversations, messages, notifications] =
    await Promise.all(
      [
        "leads",
        "appointments",
        "conversations",
        "messages",
        "notifications",
      ].map(all),
    );
  return {
    business,
    leads,
    appointments,
    conversations,
    messages,
    notifications,
  } as unknown as WorkspaceData;
}
export function dataError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (["42P01", "PGRST205", "PGRST202"].includes(code || ""))
    return {
      status: 503,
      message: "One database update is needed to enable these features.",
      code: "SETUP_REQUIRED",
    };
  if (code === "23505")
    return {
      status: 409,
      message:
        "This phone number or conversation already exists in your business.",
    };
  if (code === "23P01")
    return {
      status: 409,
      message:
        "Another appointment overlaps this time. Choose a different time.",
    };
  if (code === "23503")
    return {
      status: 400,
      message:
        "The linked customer or conversation is not available in this business.",
    };
  if (code === "42501")
    return {
      status: 403,
      message: "Your account does not have permission to make this change.",
    };
  return {
    status: 400,
    message: "The change could not be saved. Check the details and try again.",
  };
}
