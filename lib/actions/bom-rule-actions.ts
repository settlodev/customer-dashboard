"use server";

import { revalidatePath } from "next/cache";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { inventoryUrl } from "./inventory-client";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import {
  BomCostSnapshot,
  BomRule,
  BomRuleAttachment,
  BomRuleDiff,
  ExplodedLine,
  ProductRecipeSummary,
  ReplaceVariantApplyResult,
  ReplaceVariantPreview,
  WhereUsedNode,
} from "@/types/bom/type";
import {
  AttachBomRuleSchema,
  AttachBomRuleValues,
  CalculateCostSchema,
  CopyToLocationSchema,
  CreateBomRuleSchema,
  CreateBomRuleValues,
  CreateRecipeSchema,
  CreateRecipeValues,
  ReplaceVariantSchema,
  ReplaceVariantValues,
  ReviseBomRuleSchema,
  ReviseBomRuleValues,
  ReviseRecipeSchema,
  ReviseRecipeValues,
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
  } catch (error) {
    rethrowIfBoundary(error);
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

/**
 * Attachment timeline for a target. Returns the list of bindings the
 * variant or modifier-option has had over time, most recent first; each
 * entry's {@code bomRuleId} resolves to the rule that was in force.
 */
export async function getBomRuleRevisions(args: {
  productVariantId?: string;
  modifierOptionId?: string;
}): Promise<BomRuleAttachment[]> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams();
    if (args.productVariantId) params.set("productVariantId", args.productVariantId);
    if (args.modifierOptionId) params.set("modifierOptionId", args.modifierOptionId);
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/bom/rules/revisions?${params.toString()}`),
    );
    return parseStringify(data) as BomRuleAttachment[];
  } catch {
    return [];
  }
}

/**
 * List every attachment (open + closed) of a rule.
 */
export async function getBomRuleAttachments(
  ruleId: string,
): Promise<BomRuleAttachment[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/bom/rules/${ruleId}/attachments`),
    );
    return parseStringify(data) as BomRuleAttachment[];
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

/**
 * One-shot inventory-tab payload for a product's RECIPE-mode variants.
 * Returns an empty list when the product has none. Errors fall back to
 * an empty payload so the tab still renders the DIRECT section.
 */
export async function getProductRecipeSummary(
  productId: string,
): Promise<ProductRecipeSummary> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({ productId });
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/bom/rules/recipe-summary?${params.toString()}`),
    );
    return parseStringify(data) as ProductRecipeSummary;
  } catch {
    return { productId, locationId: "", variants: [] };
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

// ── Slim recipe writes (location-side, /api/v1/bom/recipes) ─────────

export async function createRecipe(
  values: CreateRecipeValues,
): Promise<FormResponse | void> {
  const validated = CreateRecipeSchema.safeParse(values);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.issues[0]?.message ?? "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }
  try {
    const apiClient = new ApiClient();
    // Forward the new rule on `data` so callers can use the returned id
    // immediately — drawer flows on the product form prime the variant's
    // bomRuleId from this without a follow-up round trip.
    const data = await apiClient.post(
      inventoryUrl("/api/v1/bom/recipes"),
      validated.data,
    );
    revalidatePath("/bom-rules");
    return parseStringify({
      responseType: "success",
      message: "Recipe created successfully",
      data,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to create recipe",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function reviseRecipe(
  id: string,
  values: ReviseRecipeValues,
): Promise<FormResponse | void> {
  const validated = ReviseRecipeSchema.safeParse(values);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.issues[0]?.message ?? "Please fill all required fields",
      error: new Error(validated.error.message),
    });
  }
  try {
    const apiClient = new ApiClient();
    // Forward the new rule on `data` so callers can compute the
    // attachment diff (revise auto-rebinds existing open attachments to
    // the new revision; the form then attach/close on top to apply any
    // variant-binding changes the operator made in the picker).
    const data = await apiClient.post(
      inventoryUrl(`/api/v1/bom/recipes/${id}/revise`),
      validated.data,
    );
    revalidatePath("/bom-rules");
    revalidatePath(`/bom-rules/${id}`);
    return parseStringify({
      responseType: "success",
      message: "Recipe revised successfully",
      data,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to revise recipe",
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

// ── Attachment lifecycle ─────────────────────────────────────────────

export async function attachBomRule(
  ruleId: string,
  values: AttachBomRuleValues,
  productId?: string,
): Promise<FormResponse | void> {
  const validated = AttachBomRuleSchema.safeParse(values);
  if (!validated.success) {
    return parseStringify({
      responseType: "error",
      message: validated.error.issues[0]?.message ?? "Invalid attachment",
      error: new Error(validated.error.message),
    });
  }
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(
      inventoryUrl(`/api/v1/bom/rules/${ruleId}/attachments`),
      validated.data,
    );
    revalidatePath("/bom-rules");
    revalidatePath(`/bom-rules/${ruleId}`);
    // The attach also flips the target variant into recipe mode and rolls
    // up its cost server-side (BomRuleService.attachInternal /
    // autoCalculateBaseCost) — but that's invisible here unless we also
    // revalidate the product's own routes. Callers that know which product
    // owns the attached variant (e.g. the standalone "attach to product"
    // dialog) should always pass it; callers nested inside a product save
    // (updateProduct/createProduct) already revalidate these paths
    // themselves, so passing it there is harmless but redundant.
    if (productId) {
      revalidatePath("/products");
      revalidatePath(`/products/${productId}`);
      revalidatePath(`/products/${productId}/edit`);
    }
    return parseStringify({
      responseType: "success",
      message: "Recipe attached",
      data,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to attach recipe",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function closeBomRuleAttachment(
  attachmentId: string,
  productId?: string,
): Promise<FormResponse | void> {
  try {
    const apiClient = new ApiClient();
    await apiClient.delete(
      inventoryUrl(`/api/v1/bom/rules/attachments/${attachmentId}`),
    );
    revalidatePath("/bom-rules");
    if (productId) {
      revalidatePath("/products");
      revalidatePath(`/products/${productId}`);
      revalidatePath(`/products/${productId}/edit`);
    }
    return parseStringify({
      responseType: "success",
      message: "Attachment closed",
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to close attachment",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function swapBomRuleAttachment(
  attachmentId: string,
  newRuleId: string,
  productId?: string,
): Promise<FormResponse | void> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(
      inventoryUrl(
        `/api/v1/bom/rules/attachments/${attachmentId}/swap?newRuleId=${encodeURIComponent(newRuleId)}`,
      ),
      {},
    );
    revalidatePath("/bom-rules");
    if (productId) {
      revalidatePath("/products");
      revalidatePath(`/products/${productId}`);
      revalidatePath(`/products/${productId}/edit`);
    }
    return parseStringify({
      responseType: "success",
      message: "Recipe swapped",
      data,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message ?? "Failed to swap recipe",
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
