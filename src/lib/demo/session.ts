import { cookies } from "next/headers";
import { businessSchema, type BusinessInput } from "@/lib/validation";
export const DEMO_COOKIE = "leadrescue_demo";
export const sampleBusiness: BusinessInput = {
  name: "Willow & Co. Plumbing",
  industry: "Plumbing",
  phone: "+14155550100",
  email: "hello@example.com",
  location: "Austin, Texas",
  timezone: "America/Chicago",
  website: "",
  description: "Your friendly neighborhood plumbing team.",
  opens: "09:00",
  closes: "17:00",
  workingDays: [1, 2, 3, 4, 5],
};
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
