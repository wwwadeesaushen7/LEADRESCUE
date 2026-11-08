import { cookies } from "next/headers";
import { businessSchema } from "@/lib/validation";
export const DEMO_COOKIE = "leadrescue_demo";
import { sampleBusiness } from "./session-data";
export { sampleBusiness } from "./session-data";
// This cookie contains only user-editable demo preferences. It grants no access
// to live accounts and is never used by the Supabase authorization layer.
export async function demoBusiness() {
  const value = (await cookies()).get(DEMO_COOKIE)?.value;
  try {
    const result = businessSchema.safeParse(JSON.parse(value || "null"));
    return result.success ? result.data : sampleBusiness;
  } catch {
    return sampleBusiness;
  }
}
