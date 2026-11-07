import { z } from "zod";
export const industries = [
  "Plumbing",
  "Electrical services",
  "Cleaning services",
  "Auto repair",
  "HVAC",
  "Landscaping",
  "Other businesses",
] as const;
export const businessSchema = z
  .object({
    name: z.string().trim().min(2, "Enter at least 2 characters.").max(100),
    industry: z.enum(industries),
    phone: z
      .string()
      .trim()
      .regex(
        /^\+[1-9]\d{7,14}$/,
        "Use international format, for example +14155550100.",
      ),
    email: z.email().max(254),
    location: z.string().trim().min(2).max(200),
    timezone: z.string().refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Choose a valid timezone."),
    website: z
      .union([
        z.literal(""),
        z
          .url()
          .refine((v) => /^https?:\/\//.test(v), "Use an http or https URL."),
      ])
      .default(""),
    description: z.string().trim().max(1000).default(""),
    opens: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    closes: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    workingDays: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .refine((v) => new Set(v).size === v.length),
  })
  .refine((v) => v.opens < v.closes, {
    message:
      "Closing time must be after opening time. Overnight shifts are not supported yet.",
    path: ["closes"],
  });
export type BusinessInput = z.infer<typeof businessSchema>;
export const emailSchema = z.object({ email: z.email().max(254) });
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128);
export const credentialsSchema = emailSchema.extend({
  password: passwordSchema,
});
export function safeNext(value: string | null) {
  return value === "/reset-password" ? value : "/dashboard";
}
