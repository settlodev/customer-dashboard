"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { inventoryUrl } from "./inventory-client";
import {
  BomCostSnapshot,
  BomRule,
  BomRuleDiff,
  ExplodedLine,
  ReplaceVariantApplyResult,
  ReplaceVariantPreview,
  WhereUsedNode,
} from "@/types/bom/type";
import {
  CalculateCostSchema,
  CopyToLocationSchema,
  CreateBomRuleSchema,
  CreateBomRuleValues,
  ReplaceVariantSchema,
  ReplaceVariantValues,
  ReviseBomRuleSchema,
  ReviseBomRuleValues,
  CopyToLocationValues,
} from "@/types/bom/schema";

/**
 * BOM rule server actions. Everything under /api/v1/bom on the Inventory
 * Service — CRUD + revise + deprecate + clone + copy-to-location + diff,
 * plus explode / calculate-cost / where-used / mass-change. The ApiClient
 * injects the X-Business-Id + X-Location-Id cookies and the Idempotency-Key
 * on POSTs automatically.
 */

// ── Reads ────────────────────────────────────────────────────────────

export async function getBomRules(status?: string): Promise<BomRule[]> {
  try {
    const apiClient = new ApiClient();
    const params = status ? `?status=${encodeURIComponent(status)}` : "";
    const data = (await apiClient.get(
      inventoryUrl(`/api/v1/bom/rules${params}`),
    )) as unknown;
    // API returns Spring Page; the .content holds the rows.
    const content = Array.isArray(data)
      ? data
      : (data as { content?: unknown[] })?.content ?? [];
    return parseStringify(content) as BomRule[];
  } catch {
    return [];
  }
}

export async function getBomRule(id: string): Promise<BomRule | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl(`/api/v1/bom/rules/${id}`));
    return parseStringify(data) as BomRule;
  } catch {
    return null;
  }
}

export async function getBomRuleRevisions(
  productVariantId: string,
): Promise<BomRule[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/bom/rules/revisions?productVariantId=${encodeURIComponent(productVariantId)}`,
      ),
    );
    return parseStringify(data) as BomRule[];
  } catch {
    return [];
  }
}

export async function resolveRuleForProduct(
  productVariantId: string,
  instant?: string,
): Promise<BomRule | null> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({ productVariantId });
    if (instant) params.set("instant", instant);
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/bom/rules/resolve-for-product?${params.toString()}`),
    );
    return parseStringify(data) as BomRule;
  } catch {
    return null;
  }
}

export async function explodeRule(
  id: string,
  orderQty = 1,
  bespoke = 1,
): Promise<ExplodedLine[]> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({
      orderQty: orderQty.toString(),
      bespoke: bespoke.toString(),
    });
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/bom/rules/${id}/explode?${params.toString()}`),
    );
    return parseStringify(data) as ExplodedLine[];
  } catch {
    return [];
  }
}

export async function getWhereUsedMultiLevel(
  stockVariantId: string,
): Promise<WhereUsedNode[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/bom/rules/where-used/multi-level/stock-variant/${stockVariantId}`,
      ),
    );
    return parseStringify(data) as WhereUsedNode[];
  } catch {
    return [];
  }
}

export async function getWhereUsedForRule(
  ruleId: string,
): Promise<WhereUsedNode[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/bom/rules/where-used/multi-level/rule/${ruleId}`),
    );
    return parseStringify(data) as WhereUsedNode[];
  } catch {
    return [];
  }
}

export async function diffRules(
  ruleAId: string,
  ruleBId: string,
): Promise<BomRuleDiff | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/bom/rules/diff?a=${encodeURIComponent(ruleAId)}&b=${encodeURIComponent(ruleBId)}`,
      ),
    );
    return parseStringify(data) as BomRuleDiff;
  } catch {
    return null;
  }
}

// ── Writes ────────────────────────────────────────────────────────────

export async function createBomRule(
  values: CreateBomRuleValues,
): Promise<FormResponse | void> {
  const validated = CreateBomRuleSchema.safeParse(values);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl("/api/v1/bom/rules"), validated.data);
    revalidatePath("/bom-rules");
    return parseStringify({
      responseType: "success",
      message: "Consumption rule created successfully",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create consumption rule",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function reviseBomRule(
  id: string,
  values: ReviseBomRuleValues,
): Promise<FormResponse | void> {
  const validated = ReviseBomRuleSchema.safeParse(values);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all the required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    await apiClient.post(
      inventoryUrl(`/api/v1/bom/rules/${id}/revise`),
      validated.data,
    );
    revalidatePath("/bom-rules");
    revalidatePath(`/bom-rules/${id}`);
    return parseStringify({
      responseType: "success",
      message: "New revision created",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to revise consumption rule",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function deprecateBomRule(id: string): Promise<FormResponse | void> {
  try {
    const apiClient = new ApiClient();
    await apiClient.post(inventoryUrl(`/api/v1/bom/rules/${id}/deprecate`), {});
    revalidatePath("/bom-rules");
    revalidatePath(`/bom-rules/${id}`);
    return parseStringify({
      responseType: "success",
      message: "Consumption rule deprecated",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to deprecate",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function cloneBomRule(id: string): Promise<FormResponse | void> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(inventoryUrl(`/api/v1/bom/rules/${id}/clone`), {});
    revalidatePath("/bom-rules");
    return parseStringify({
      responseType: "success",
      message: "Consumption rule cloned",
      data,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to clone",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function copyToLocation(
  values: CopyToLocationValues,
): Promise<FormResponse | void> {
  const validated = CopyToLocationSchema.safeParse(values);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.issues[0]?.message ?? "Invalid copy-to-location request",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(
      inventoryUrl("/api/v1/bom/rules/copy-to-location"),
      validated.data,
    );
    revalidatePath("/bom-rules");
    const count = Array.isArray(data) ? data.length : 0;
    return parseStringify({
      responseType: "success",
      message: `Copied ${count} consumption rule(s) to target location`,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to copy consumption rules",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function calculateBomCost(
  id: string,
  costMethod: string = "MOVING_AVG",
): Promise<BomCostSnapshot | null> {
  const validated = CalculateCostSchema.safeParse({ costMethod });
  if (!validated.success) return null;
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(
      inventoryUrl(`/api/v1/bom/rules/${id}/calculate-cost`),
      validated.data,
    );
    return parseStringify(data) as BomCostSnapshot;
  } catch {
    return null;
  }
}

// ── Mass change ──────────────────────────────────────────────────────

export async function previewReplaceVariant(
  values: ReplaceVariantValues,
): Promise<ReplaceVariantPreview | null> {
  const validated = ReplaceVariantSchema.safeParse(values);
  if (!validated.success) return null;
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(
      inventoryUrl("/api/v1/bom/mass-change/replace-variant/preview"),
      validated.data,
    );
    return parseStringify(data) as ReplaceVariantPreview;
  } catch {
    return null;
  }
}

export async function applyReplaceVariant(
  values: ReplaceVariantValues,
): Promise<FormResponse | void> {
  const validated = ReplaceVariantSchema.safeParse(values);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }

  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl("/api/v1/bom/mass-change/replace-variant/apply"),
      validated.data,
    )) as ReplaceVariantApplyResult;
    revalidatePath("/bom-rules");
    return parseStringify({
      responseType: "success",
      message: `Updated ${data.rulesUpdated} rule(s) — ${data.errors.length} error(s)`,
      data,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to apply variant replacement",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
