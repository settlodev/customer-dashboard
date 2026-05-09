import { z } from "zod";

/**
 * Schema for create/update of a Chart of Account row. Lives on the
 * client side so forms (and the chart-of-account settings panel) can
 * validate before the server action is invoked. Server actions can't
 * export schemas alongside async functions — Next requires `"use
 * server"` files to export only async functions.
 */
export const ChartOfAccountSchema = z.object({
  code: z.string().min(1, "Code is required").max(20),
  name: z.string().min(2, "Name is required").max(255),
  description: z.string().max(500).optional().or(z.literal("")),
  accountType: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  accountSubType: z.string().max(50).optional().or(z.literal("")),
  normalBalance: z.enum(["DEBIT", "CREDIT"]),
  parentId: z.string().uuid().optional().nullable().or(z.literal("")),
});

export type ChartOfAccountFormValues = z.infer<typeof ChartOfAccountSchema>;
