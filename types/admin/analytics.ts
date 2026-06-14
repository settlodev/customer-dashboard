// ── MRR ─────────────────────────────────────────────────────────────

export interface MrrMovement {
  metric_date: string;
  starting_mrr: number;
  ending_mrr: number;
  new_mrr: number;
  expansion_mrr: number;
  contraction_mrr: number;
  churn_mrr: number;
  reactivation_mrr: number;
  net_new_mrr: number;
  new_customer_count: number;
  expansion_customer_count: number;
  contraction_customer_count: number;
  churn_customer_count: number;
  reactivation_customer_count: number;
  paying_customers: number;
  mrr_arr_ratio: number;
  computed_at: string;
  ver: number;
}

// ── Retention ────────────────────────────────────────────────────────

export interface RetentionCohortCell {
  cohort_month: string;
  months_since_signup: number;
  cohort_size: number;
  active_businesses: number;
  orders_in_period: number;
  retention_rate: number;
  revenue_in_period: number;
  arpa_in_period: number;
  computed_at: string;
  ver: number;
}

// ── Churn ────────────────────────────────────────────────────────────

export type ChurnTier = "HIGH" | "MEDIUM" | "LOW";

export interface ChurnPrediction {
  business_id: string;
  account_id: string;
  business_name: string | null;
  risk_tier: ChurnTier;
  churn_probability_7d: number;
  churn_probability_30d: number;
  churn_probability_90d: number;
  days_since_last_order: number | null;
  days_since_last_login: number | null;
  subscription_status: string | null;
  is_past_due: number;
  is_in_trial: number;
  trial_days_remaining: number | null;
  billing_status: string | null;
  past_due_item_count: number;
  expired_item_count: number;
  suspended_item_count: number;
  revenue_trend_30d: number;
  top_contributing_features: string | null;
  recommended_action: string | null;
}

export interface ChurnSummary {
  total_scored: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  avg_churn_prob_30d: number;
}

// ── Engagement ───────────────────────────────────────────────────────

export interface EngagementSnapshot {
  metric_date: string;
  dau: number | null;
  wau: number | null;
  mau: number | null;
  [key: string]: unknown;
}

// ── Activation funnel ────────────────────────────────────────────────

export interface ActivationCohort {
  cohort_month: string;
  cohort_size: number;
  pct_reached_email_verified: number | null;
  pct_reached_business: number | null;
  pct_reached_location: number | null;
  pct_reached_product: number | null;
  pct_reached_staff: number | null;
  pct_reached_device: number | null;
  pct_reached_first_order: number | null;
  pct_reached_paid_order: number | null;
  pct_reached_subscription: number | null;
  p50_days_to_business: number | null;
  p50_days_to_location: number | null;
  p50_days_to_product: number | null;
  p50_days_to_staff: number | null;
  p50_days_to_first_order: number | null;
  p50_days_to_paid_order: number | null;
  p50_days_to_subscription: number | null;
  p90_days_to_first_order: number | null;
  p90_days_to_subscription: number | null;
  computed_at: string;
  ver: number;
}

// ── Trial conversion ─────────────────────────────────────────────────

export interface TrialConversionRow {
  cohort_month: string;
  package_id: string | null;
  package_name: string | null;
  trials_started: number;
  trials_converted: number;
  trials_expired: number;
  trials_cancelled: number;
  trials_still_active: number;
  conversion_rate: number;
  median_days_to_convert: number | null;
  avg_days_to_convert: number | null;
  revenue_from_cohort: number;
  arpa_from_cohort: number;
  computed_at: string;
  ver: number;
}
