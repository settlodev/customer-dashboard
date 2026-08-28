"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { SettloApiError } from "@/lib/settlo-api-error-handler";
import { parseStringify } from "@/lib/utils";
import type {
  CommitResponse,
  ImportType,
  PreviewResponse,
  RowDecision,
} from "@/types/imports/type";

import { getCurrentDestination } from "./context";
import { inventoryUrl } from "./inventory-client";
import { getDaySessionCookie } from "./day-session-cookie-actions";
import {
  getCurrentDaySession,
  openDaySession,
} from "./location-day-sessions-actions";

export type PreviewResult =
  | { ok: true; data: PreviewResponse }
  | { ok: false; message: string };

export type CommitResult =
  | { ok: true; data: CommitResponse }
  // `pending` means the request reached the server but we never got a result
  // (gateway timeout / 5xx / dropped connection). The import may have already
  // completed — the UI must warn rather than invite a duplicate re-import.
  // `blocked` means the server refused the WHOLE batch on a plan cap —
  // nothing was written; the preview is still cached, so trimming rows and
  // re-committing the same previewId is safe.
  | { ok: false; pending?: boolean; blocked?: boolean; message: string };

/**
 * Multipart preview. The file is forwarded as-is to the inventory
 * service which parses, validates, and caches the rows in Redis under
 * the returned {@code previewId}. The same id powers a later commit.
 */
export async function previewImport(
  type: ImportType,
  file: File,
): Promise<PreviewResult> {
  if (!file || file.size === 0) {
    return { ok: false, message: "Choose a CSV file" };
  }
  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl("/api/v1/imports/preview"),
      fd,
    )) as PreviewResponse;
    return { ok: true, data: parseStringify(data) };
  } catch (error: unknown) {
    console.error("previewImport failed", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to preview import",
    };
  }
}

/**
 * Import types whose commit posts stock — an opening balance or an intake —
 * and which therefore reach a session-anchored write on the server.
 * PRODUCT is absent on purpose: it creates untracked products and never
 * touches the ledger, so it must not open a business day as a side effect.
 */
const STOCK_POSTING_IMPORTS: readonly ImportType[] = [
  "STOCK",
  "STOCK_INTAKE",
  "STOCK_WITH_PRODUCT",
  "PRODUCT_WITH_STOCK",
];

/**
 * Guarantees an {@code X-Day-Session-Id} will be attached to the commit.
 *
 * <p>Why this exists: the commit endpoint itself has no day-session
 * requirement, but the opening-stock / intake write nested inside it calls
 * {@code BusinessDayResolver.requireSessionForRequest}, which throws
 * {@code BUSINESS_DAY_SESSION_HEADER_MISSING} when the header is absent.
 * The inventory service caught that and logged it, so a merchant importing
 * before opening the day got a green "N created" and zero on hand.
 *
 * <p>Opening a business day is not free — it sets the business date that
 * cash-up and close-of-day reports hang off — so this only ever opens one
 * when Accounts confirms there genuinely is none. The {@code /current}
 * probe first is what stops a merchant whose day is already open on the POS
 * (dashboard cookie merely missing or stale) from getting a second one.
 *
 * <p>Scoped to LOCATION destinations. A store or warehouse day session
 * belongs to its parent location, and the destination cookie carries no
 * parent id — the same limit the existing business-day-closed dialog has.
 * In that case this no-ops and the server's warning stands.
 */
async function ensureBusinessDayOpen(type: ImportType): Promise<void> {
  if (!STOCK_POSTING_IMPORTS.includes(type)) return;

  const destination = await getCurrentDestination();
  if (destination?.type !== "LOCATION") return;

  // Mirrors the interceptor's own guard: the header is only attached when the
  // cookie exists AND belongs to the location being targeted.
  const cookie = await getDaySessionCookie();
  if (cookie?.id && cookie.locationId === destination.id) return;

  try {
    // Refreshes the cookie as a side effect when a session already exists.
    const current = await getCurrentDaySession(destination.id);
    if (current?.id) return;
  } catch {
    // Transient Accounts blip. Fall through and try to open — an
    // already-open day comes back as DAY_SESSION_ALREADY_OPEN, which
    // openDaySession treats as success rather than an error.
  }

  const opened = await openDaySession(destination.id);
  if (opened.responseType !== "success") {
    console.error(
      `Could not open a business day at ${destination.id} before a ${type} import — ` +
        "quantities will not post",
      opened.message,
    );
    return;
  }
  // ALREADY_OPEN returns success carrying no session, so the cookie the
  // interceptor reads may still be unset. One more probe writes it.
  if (!opened.data?.id) {
    try {
      await getCurrentDaySession(destination.id);
    } catch {
      // Best effort — the server-side warning covers the remaining gap.
    }
  }
}

export async function commitImport(
  type: ImportType,
  previewId: string,
  decisions: RowDecision[],
): Promise<CommitResult> {
  if (!previewId) return { ok: false, message: "Missing previewId" };
  if (!decisions.length)
    return { ok: false, message: "No decisions to commit" };
  try {
    // Before the POST, so the interceptor picks the cookie up on this request.
    await ensureBusinessDayOpen(type);
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl("/api/v1/imports/commit"),
      { previewId, decisions },
    )) as CommitResponse;
    // Partial success: valid rows commit even when others fail, so refresh
    // the list pages whenever at least one row actually landed. Per-row
    // failures ride along in `data.errors` for the UI to surface.
    if (data.created + data.updated > 0) {
      invalidatePaths(type);
    }
    return { ok: true, data: parseStringify(data) };
  } catch (error: unknown) {
    console.error("commitImport failed", error);
    const message = error instanceof Error ? error.message : "Commit failed";
    // The server refused the whole batch on a plan cap (whole-batch 400,
    // nothing written) — distinct from a per-row validation failure. Checked
    // before the `pending` heuristic below: a 400 never satisfies it anyway,
    // but this also short-circuits before that generic classification runs.
    // Only `.code` is checked, not `.digest`: the constructor sets
    // `digest = code` on the very same object, so the two can never
    // disagree here — `.digest` only matters once an Error has crossed a
    // Server Component → Client boundary and lost every property but
    // `message`/`digest`, which hasn't happened yet inside this try/catch.
    const blocked =
      error instanceof SettloApiError && error.code === "BILLING_ERROR";
    if (blocked) {
      return { ok: false, blocked: true, message };
    }
    // The import is non-idempotent, so the failure mode matters. A clean 4xx
    // (expired preview, validation) means nothing ran — safe to fix and retry.
    // A gateway timeout / 5xx / network drop means the server may have
    // processed the import even though we never saw the result.
    const status = (error as { status?: number })?.status ?? 0;
    const pending =
      status === 0 ||
      status === 408 ||
      status >= 500 ||
      /took too long|timed?\s?out|temporarily unavailable|try again/i.test(
        message,
      );
    return { ok: false, pending, message };
  }
}

// ── Auto-create missing lookups ─────────────────────────────────────
//
// PRODUCT imports fail row-by-row when a referenced category or brand
// doesn't exist yet. Rather than forcing the merchant to bounce out and
// create them one by one, the preview screen lets them auto-create the
// missing ones in bulk; the front-end then re-runs the preview so the
// rows pick up the new IDs and turn READY.
//
// Department for new categories is left unset — the inventory service
// auto-resolves to the location's single / default department.

export interface BulkCreateLookupsResult {
  ok: boolean;
  createdCategories: number;
  createdBrands: number;
  errors: string[];
}

export async function bulkCreateMissingLookups({
  categories,
  brands,
}: {
  categories: string[];
  brands: string[];
}): Promise<BulkCreateLookupsResult> {
  const apiClient = new ApiClient();
  const locationType = (await getCurrentDestination())?.type ?? "LOCATION";

  const errors: string[] = [];
  let createdCategories = 0;
  let createdBrands = 0;

  const categoryTasks = categories.map(async (name) => {
    try {
      await apiClient.post(inventoryUrl("/api/v1/categories"), {
        locationType,
        name,
      });
      createdCategories++;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Create failed";
      errors.push(`Category "${name}": ${message}`);
    }
  });

  const brandTasks = brands.map(async (name) => {
    try {
      await apiClient.post(inventoryUrl("/api/v1/brands"), {
        locationType,
        name,
      });
      createdBrands++;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Create failed";
      errors.push(`Brand "${name}": ${message}`);
    }
  });

  await Promise.all([...categoryTasks, ...brandTasks]);
  return { ok: errors.length === 0, createdCategories, createdBrands, errors };
}

function invalidatePaths(type: ImportType) {
  switch (type) {
    case "PRODUCT":
    case "PRODUCT_WITH_STOCK":
    case "STOCK_WITH_PRODUCT":
      revalidatePath("/products");
      revalidatePath("/stock-variants");
      break;
    case "STOCK":
      revalidatePath("/stock-variants");
      break;
    case "STOCK_INTAKE":
      revalidatePath("/stock-intakes");
      revalidatePath("/stock-variants");
      break;
  }
}
