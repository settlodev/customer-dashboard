import * as z from "zod";

// ── Operating hours entry ─────────────────────────────────────────

export const OperatingHoursEntrySchema = z.object({
  dayOfWeek: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  openTime: z.string(),
  closeTime: z.string(),
  closed: z.boolean(),
});

export type OperatingHoursEntry = z.infer<typeof OperatingHoursEntrySchema>;

// ── Location schema ───────────────────────────────────────────────

export const LocationSchema = z.object({
  name: z
    .string({ required_error: "Location name is required" })
    .min(2, "Location name must be at least 2 characters")
    .max(255, "Location name cannot exceed 255 characters"),

  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  website: z.string().optional(),

  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  street: z.string().optional(),

  description: z.string().max(2000).optional(),

  // ── Replaces openingTime / closingTime ──────────────────────────
  continuousOperation: z.boolean().default(false),
  dailyCutoffTime: z.string().optional(),
  operatingHours: z.array(OperatingHoursEntrySchema).optional(),

  status: z.boolean().default(true),
  image: z.string().optional(),
});
