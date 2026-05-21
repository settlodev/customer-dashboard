import { z } from "zod";

import { InternalRole } from "@/types/types";

// ── Internal users (Auth Service) ───────────────────────────────────

const INTERNAL_ROLES = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
  "BOARD_MEMBER",
  "SALES_TEAM",
] as const satisfies readonly InternalRole[];

export const CreateInternalUserSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(100, "Password is too long"),
  role: z.enum(INTERNAL_ROLES, {
    errorMap: () => ({ message: "Select a role" }),
  }),
});

export const UpdateInternalRoleSchema = z.object({
  role: z.enum(INTERNAL_ROLES, {
    errorMap: () => ({ message: "Select a role" }),
  }),
});

// ── Support agents (Accounts Service) ───────────────────────────────

export const CreateSupportAgentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(100, "Password is too long"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

// ── Billing (Billing Service) ───────────────────────────────────────

export const GenerateInvoiceSchema = z.object({
  months: z
    .number()
    .int("Months must be a whole number")
    .min(1, "Minimum 1 month")
    .max(36, "Maximum 36 months"),
});

export const RecordManualPaymentSchema = z.object({
  paymentMethod: z.enum([
    "MOBILE_MONEY",
    "BANK_TRANSFER",
    "CASH",
    "CHECK",
    "OTHER",
  ]),
  referenceNumber: z.string().min(1, "Reference number is required"),
  amount: z.number().positive("Amount must be positive"),
  notes: z.string().max(500).optional(),
});

export const CreateRefundSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive("Amount must be positive"),
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(500, "Reason is too long"),
});

export const ApplyDiscountSchema = z.object({
  discountId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const GrantFreeSubscriptionSchema = z.object({
  durationMonths: z
    .number()
    .int()
    .min(1, "Minimum 1 month")
    .max(120, "Maximum 120 months")
    .optional(),
  reason: z.string().min(1, "Reason is required").max(500),
});
