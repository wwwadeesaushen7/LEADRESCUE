import type { BusinessInput } from "@/lib/validation";
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
