"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { inventoryUrl } from "./inventory-client";
import type {
  StockMovementReportResponse,
  StockMovementReportRow,
  StockMovementReportSummary,
  StockStatus,
} from "@/types/stock-movement-report/type";

interface StockMovementQuery {
  from: string;
  to: string;
  asOf: string;
  /** 0-based page. */
  page: number;
  size: number;
  search?: string;
  lens?: string;
  /** "<column>,<asc|desc>". */
  sort?: string;
}

const EMPTY_SUMMARY: StockMovementReportSummary = {
  totalOpening: 0,
  totalIn: 0,
  totalOut: 0,
  totalNet: 0,
  totalClosing: 0,
  totalValue: 0,
  all: 0,
  movers: 0,
  low: 0,
  out: 0,
  dead: 0,
  reserved: 0,
};

const EMPTY_STOCK_MOVEMENT_REPORT: StockMovementReportResponse = {
  summary: EMPTY_SUMMARY,
  content: [],
  page: 0,
  size: 0,
  totalElements: 0,
  totalPages: 0,
  last: true,
};

const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const nOrNull = (v: unknown): number | null => (v == null ? null : n(v));
const iOrNull = (v: unknown): number | null => (v == null ? null : Math.round(n(v)));

const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

/**
 * Fetch one page of the stock movement report from the Inventory Service.
 * The active location rides on the X-Location-Id header (set by ApiClient),
 * so no locationId is passed. Fails soft to an empty report.
 */
export async function getStockMovementReport(
  q: StockMovementQuery,
): Promise<StockMovementReportResponse> {
  try {
    const params = new URLSearchParams({
      from: q.from,
      to: q.to,
      asOf: q.asOf,
      page: String(q.page),
      size: String(q.size),
      lens: q.lens ?? "all",
    });
    if (q.search) params.set("search", q.search);
    if (q.sort) params.set("sort", q.sort);

    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/reports/stock-movement/by-item?${params.toString()}`),
    );
    const raw = rec(parseStringify(data));
    if (Object.keys(raw).length === 0) return EMPTY_STOCK_MOVEMENT_REPORT;

    const s = rec(raw.summary);
    const summary: StockMovementReportSummary = {
      totalOpening: n(s.totalOpening),
      totalIn: n(s.totalIn),
      totalOut: n(s.totalOut),
      totalNet: n(s.totalNet),
      totalClosing: n(s.totalClosing),
      totalValue: n(s.totalValue),
      all: n(s.all),
      movers: n(s.movers),
      low: n(s.low),
      out: n(s.out),
      dead: n(s.dead),
      reserved: n(s.reserved),
    };

    const content: StockMovementReportRow[] = Array.isArray(raw.content)
      ? raw.content.map((row) => mapRow(rec(row)))
      : [];

    return {
      summary,
      content,
      page: Math.round(n(raw.page)),
      size: Math.round(n(raw.size)),
      totalElements: Math.round(n(raw.totalElements)),
      totalPages: Math.round(n(raw.totalPages)),
      last: Boolean(raw.last),
    };
  } catch {
    return EMPTY_STOCK_MOVEMENT_REPORT;
  }
}

function mapRow(r: Record<string, unknown>): StockMovementReportRow {
  const b = rec(r.breakdown);
  const status = String(r.status ?? "ok") as StockStatus;
  return {
    variantId: String(r.variantId ?? ""),
    variantName: String(r.variantName ?? ""),
    stockName: String(r.stockName ?? ""),
    sku: r.sku == null ? null : String(r.sku),
    opening: n(r.opening),
    qtyIn: n(r.qtyIn),
    qtyOut: n(r.qtyOut),
    net: n(r.net),
    closing: n(r.closing),
    value: n(r.value),
    reserved: n(r.reserved),
    available: n(r.available),
    avgCost: n(r.avgCost),
    reorderPoint: nOrNull(r.reorderPoint),
    status,
    dailyUse: nOrNull(r.dailyUse),
    daysOfCover: iOrNull(r.daysOfCover),
    daysIdle: iOrNull(r.daysIdle),
    lastMovementAt: r.lastMovementAt == null ? null : String(r.lastMovementAt),
    breakdown: {
      purchase: n(b.purchase),
      sale: n(b.sale),
      transferIn: n(b.transferIn),
      transferOut: n(b.transferOut),
      adjustment: n(b.adjustment),
      damage: n(b.damage),
      return: n(b.return),
      recipeUsage: n(b.recipeUsage),
      openingBalance: n(b.openingBalance),
    },
  };
}
