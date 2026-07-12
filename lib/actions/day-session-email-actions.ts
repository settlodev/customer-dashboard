"use server";

import ApiClient from "@/lib/settlo-api-client";
import type { FormResponse } from "@/types/types";
import { fmt, marginPct, resolveCurrency } from "@/lib/day-sessions/cod-format";
import {
  shareDaySessionReport,
  getPublicCloseOfDay,
} from "./day-session-share-actions";

// Platform default sender (Communications' CommunicationConfig default).
const DEFAULT_FROM = "no-reply@settlo.co.tz";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email a Close-of-Day summary with a link to the full online report.
 *
 * Mints (or reuses) the public share token + snapshot, then sends the
 * shared `close-of-day-summary` template via the Communications service
 * ({@code POST /api/v1/emails}, which renders `templateId` server-side) —
 * the very same template the auto-on-close email uses. No PDF is attached
 * for now; the "View Full Report" button links to the public
 * `/cod/{token}` page. (PDF attachment is a later enhancement — the render
 * seam lives in the report-renderer service.)
 */
export async function emailCloseOfDayReport(
  locationId: string,
  sessionId: string,
  recipients: string[],
  opts?: { businessDate?: string; identifier?: string; cc?: string[] },
): Promise<FormResponse> {
  const to = (recipients ?? [])
    .map((r) => r.trim())
    .filter((r) => EMAIL_RE.test(r));
  if (to.length === 0) {
    return { responseType: "error", message: "Enter at least one valid email address." };
  }
  const cc = (opts?.cc ?? [])
    .map((r) => r.trim())
    .filter((r) => EMAIL_RE.test(r) && !to.includes(r));

  try {
    // 1. Ensure a public token + fresh snapshot exists (the email links to it).
    const share = await shareDaySessionReport(locationId, sessionId, null);
    if ("error" in share) {
      return { responseType: "error", message: share.error };
    }
    const token = share.shareToken;
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
    const reportUrl = `${base}/cod/${token}`;

    // 2. Pull the aggregated figures for the summary (same source the page renders).
    const pub = await getPublicCloseOfDay(token);
    const report = pub?.report ?? null;
    const currency = resolveCurrency(pub?.reportCurrency, pub?.currency);
    const locationName =
      pub?.letterhead?.letterhead?.locationName ??
      pub?.letterhead?.letterhead?.businessName ??
      "Your location";

    const net = report?.sales.net ?? 0;
    const margin = marginPct(report?.grossProfit, net);
    const compsAmount = report?.complimentaryAmount ?? 0;
    const refundCount = report?.refunds.count ?? 0;
    const refundAmount = report?.refunds.amount ?? 0;

    const templateData: Record<string, unknown> = {
      locationName,
      businessDate: opts?.businessDate ?? "",
      currency,
      netSales: fmt(net),
      grossSales: fmt(report?.sales.gross),
      orderCount: fmt(report?.orderCount),
      grossProfit: fmt(report?.grossProfit),
      tips: fmt(report?.sales.tips),
      discounts: fmt(report?.sales.discounts),
      cogs: fmt(report?.cogs),
      reportLink: reportUrl,
      email: to[0],
      ...(compsAmount > 0 ? { hasComps: true, compsAmount: fmt(compsAmount) } : {}),
      ...(refundCount > 0 || refundAmount > 0
        ? { hasRefunds: true, refundAmount: fmt(refundAmount), refundCount: fmt(refundCount) }
        : {}),
      ...(margin != null ? { margin: `${margin}%` } : {}),
    };

    // 3. Send via Communications using the shared summary template.
    const subject = `Close of Day summary${
      opts?.businessDate ? ` — ${opts.businessDate}` : ""
    }`;
    const comms = new ApiClient("communications");
    await comms.post("/api/v1/emails", {
      from: DEFAULT_FROM,
      fromName: "Settlo",
      to,
      ...(cc.length > 0 ? { cc } : {}),
      subject,
      templateId: "close-of-day-summary",
      templateData,
    });

    return {
      responseType: "success",
      message: `Summary emailed to ${to.join(", ")}.`,
    };
  } catch (error) {
    return {
      responseType: "error",
      message: error instanceof Error ? error.message : "Failed to email the report.",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
