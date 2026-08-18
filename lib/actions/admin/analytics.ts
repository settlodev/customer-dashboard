"use server";

import {
  reportsInternalGet,
  reportsInternalPost,
} from "@/lib/reports-internal-client";
import {
  ActivationCohort,
  BillingRetentionCohortCell,
  ChurnPrediction,
  ChurnSummary,
  ChurnTier,
  EngagementSnapshot,
  MrrMovement,
  RetentionCohortCell,
  TrialConversionRow,
} from "@/types/admin/analytics";

const PREFIX = "/api/v2/internal/metrics";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getDefaultRange(days = 180): Promise<{
  startDate: string;
  endDate: string;
}> {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

// ── MRR ─────────────────────────────────────────────────────────────

export async function getMrrMovements(
  startDate: string,
  endDate: string,
): Promise<MrrMovement[]> {
  return reportsInternalGet<MrrMovement[]>(`${PREFIX}/saas/mrr/movements`, {
    startDate,
    endDate,
  });
}

export async function getLatestMrr(): Promise<MrrMovement | null> {
  const result = await reportsInternalGet<MrrMovement | null>(
    `${PREFIX}/saas/mrr/movements/latest`,
  );
  return result ?? null;
}

// ── Retention ────────────────────────────────────────────────────────

export async function getRetentionCohorts(
  months = 12,
): Promise<RetentionCohortCell[]> {
  return reportsInternalGet<RetentionCohortCell[]>(
    `${PREFIX}/saas/retention/cohorts`,
    { months },
  );
}

export async function getBillingRetentionCohorts(
  months = 12,
): Promise<BillingRetentionCohortCell[]> {
  return reportsInternalGet<BillingRetentionCohortCell[]>(
    `${PREFIX}/saas/retention/billing/cohorts`,
    { months },
  );
}

// ── Churn ────────────────────────────────────────────────────────────

export async function getChurnPredictions(
  tier: ChurnTier = "HIGH",
  limit = 100,
): Promise<ChurnPrediction[]> {
  return reportsInternalGet<ChurnPrediction[]>(
    `${PREFIX}/saas/churn/predictions`,
    { tier, limit },
  );
}

export async function getChurnSummary(): Promise<ChurnSummary | null> {
  const result = await reportsInternalGet<ChurnSummary | null>(
    `${PREFIX}/saas/churn/summary`,
  );
  return result ?? null;
}

// ── Engagement ───────────────────────────────────────────────────────

export async function getEngagement(
  startDate: string,
  endDate: string,
): Promise<EngagementSnapshot[]> {
  return reportsInternalGet<EngagementSnapshot[]>(`${PREFIX}/engagement`, {
    startDate,
    endDate,
  });
}

export async function getLatestEngagement(): Promise<EngagementSnapshot | null> {
  const result = await reportsInternalGet<EngagementSnapshot | null>(
    `${PREFIX}/engagement/latest`,
  );
  return result ?? null;
}

// ── Activation ───────────────────────────────────────────────────────

export async function getActivationFunnel(
  months = 12,
): Promise<ActivationCohort[]> {
  return reportsInternalGet<ActivationCohort[]>(
    `${PREFIX}/saas/activation/funnel`,
    { months },
  );
}

// ── Trial conversion ─────────────────────────────────────────────────

export async function getTrialConversion(
  packageName?: string,
): Promise<TrialConversionRow[]> {
  return reportsInternalGet<TrialConversionRow[]>(
    `${PREFIX}/saas/trial/conversion`,
    packageName ? { packageName } : undefined,
  );
}

// ── Recompute triggers (manual ops) ─────────────────────────────────

export async function recomputeMrr(
  startDate: string,
  endDate: string,
): Promise<{ status: string }> {
  return reportsInternalPost<{ status: string }>(
    `${PREFIX}/saas/mrr/recompute`,
    { startDate, endDate },
  );
}

export async function recomputeRetention(): Promise<{ status: string }> {
  return reportsInternalPost<{ status: string }>(
    `${PREFIX}/saas/retention/recompute`,
  );
}

export async function recomputeChurn(): Promise<{ status: string }> {
  return reportsInternalPost<{ status: string }>(
    `${PREFIX}/saas/churn/recompute`,
  );
}

export async function recomputeActivation(): Promise<{ status: string }> {
  return reportsInternalPost<{ status: string }>(
    `${PREFIX}/saas/activation/recompute`,
  );
}

export async function recomputeTrial(): Promise<{ status: string }> {
  return reportsInternalPost<{ status: string }>(
    `${PREFIX}/saas/trial/recompute`,
  );
}
