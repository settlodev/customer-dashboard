/**
 * Reports Service per-business endpoints return ClickHouse rows as
 * `Map<String, Object>`. The shapes below mirror the actual SQL column
 * names used by the queries — anything that could be null on first-pull
 * (no orders yet, no health score yet) is typed nullable.
 */

export type DateRangeFilter =
  | "TODAY"
  | "YESTERDAY"
  | "THIS_WEEK"
  | "LAST_WEEK"
  | "THIS_MONTH"
  | "LAST_MONTH"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "LAST_90_DAYS"
  | "THIS_YEAR"
  | "LAST_YEAR"
  | "CUSTOM";

export interface BusinessOverviewSnapshot {
  total_orders: number | null;
  completed_orders: number | null;
  cancelled_orders: number | null;
  refunded_orders: number | null;
  gross_sales: number | null;
  net_sales: number | null;
  total_discount: number | null;
  total_cost: number | null;
  gross_profit: number | null;
  total_tips: number | null;
  avg_order_value: number | null;
  active_locations: number | null;
  active_staff: number | null;
  unique_customers: number | null;
  transactions_amount: number | null;
  complimentary_amount: number | null;
  signed_bill_amount: number | null;
  total_refund_count: number | null;
  total_refunded_amount: number | null;
  expenses_paid: number | null;
}

/**
 * One location's trading inside a business's window. Mirrors the headline
 * block of `BusinessOverviewSnapshot` so a location row here and that
 * location's own detail page agree.
 *
 * `refunded_orders` is the order-level `is_refunded` flag — a count of orders
 * touched by a refund, not of refund documents. For refund counts/amounts,
 * transactions or expenses at this grain, read the location overview instead;
 * those need their own scans and are deliberately not in the breakdown.
 */
export interface BusinessLocationBreakdownRow {
  location_id: string;
  location_name: string | null;
  total_orders: number | null;
  completed_orders: number | null;
  cancelled_orders: number | null;
  written_off_orders: number | null;
  deferred_orders: number | null;
  refunded_orders: number | null;
  gross_sales: number | null;
  net_sales: number | null;
  total_discount: number | null;
  total_cost: number | null;
  gross_profit: number | null;
  total_tips: number | null;
  avg_order_value: number | null;
  active_staff: number | null;
  unique_customers: number | null;
  /** Latest business date with an order in the window — null if none. */
  last_order_date: string | null;
}

export interface BusinessDailyTrendRow {
  business_date: string;
  total_orders: number | null;
  completed_orders: number | null;
  net_sales: number | null;
  gross_profit: number | null;
  active_locations: number | null;
}

export interface BusinessHealthSnapshot {
  business_id: string;
  score_date: string | null;
  health_score: number | null;
  revenue_score: number | null;
  engagement_score: number | null;
  growth_score: number | null;
  retention_score: number | null;
  operational_score: number | null;
  churn_probability: number | null;
  growth_trajectory: string | null;
  [key: string]: unknown;
}

export interface BusinessLifecycleSnapshot {
  business_id: string;
  account_id: string | null;
  business_name: string | null;
  region: string | null;
  lifecycle_stage: string | null;
  is_churned: number | null;
  total_orders: number | null;
  total_revenue: number | null;
  last_order_at: string | null;
  days_since_last_order: number | null;
  first_order_at: string | null;
  first_paid_order_at: string | null;
  first_product_at: string | null;
  first_location_at: string | null;
  last_active_at: string | null;
  business_created_at: string | null;
  current_package_name: string | null;
}

/**
 * One staff member's sales at a location over a window, from
 * `/business/{id}/staff-leaderboard?locationId=`.
 *
 * `staff_id` is `fact_orders.started_by` — a staff id, not the JWT subject id.
 */
export interface LocationStaffRow {
  staff_id: string;
  staff_name: string | null;
  total_orders: number | null;
  total_revenue: number | null;
  total_profit: number | null;
  avg_order_value: number | null;
  avg_items_per_order: number | null;
  refund_count: number | null;
  refund_rate: number | null;
}

/**
 * One location's health score inside a business, from
 * `ml_location_health_score` (V081). The per-location cut of
 * {@link BusinessHealthSnapshot} — same model, same weights, so the two grains
 * compare directly.
 */
export interface LocationHealthRow {
  location_id: string;
  location_name: string | null;
  score_date: string | null;
  health_score: number | null;
  revenue_score: number | null;
  engagement_score: number | null;
  growth_score: number | null;
  retention_score: number | null;
  operational_score: number | null;
  churn_probability: number | null;
  growth_trajectory: string | null;
}

/**
 * A location's own lifecycle row, from the nightly `saas_location_lifecycle`
 * rollup (V080).
 *
 * The location-grained counterpart of {@link BusinessLifecycleSnapshot}, and the
 * point of it: a business is the sum of its locations, so a merchant whose
 * flagship is thriving reads as healthy even when its branches went quiet months
 * ago. Churn, recency and stage are only meaningful at this grain.
 *
 * Note `days_since_last_order` is genuinely nullable here — NULL means the
 * location has never taken an order. Unlike the business rollup there is no 9999
 * sentinel; read it through `daysSinceLastOrder()` in `lib/admin/lifecycle`,
 * which handles both.
 */
export interface LocationLifecycleSnapshot {
  location_id: string;
  business_id: string;
  account_id: string | null;
  location_name: string | null;
  business_name: string | null;
  region: string | null;
  lifecycle_stage: string | null;
  is_churned: number | null;
  total_orders: number | null;
  paid_orders: number | null;
  total_revenue: number | null;
  last_order_at: string | null;
  last_order_date: string | null;
  days_since_last_order: number | null;
  first_order_at: string | null;
  first_paid_order_at: string | null;
  first_product_at: string | null;
  first_subscription_at: string | null;
  location_created_at: string | null;
  /** This location's own SubscriptionItemStatus; "" when it has no item. */
  subscription_status: string | null;
  /** Derived: ACTIVE + never charged + an open trial window. */
  is_trial: number | null;
  current_package_name: string | null;
  trial_end_date: string | null;
  paid_through: string | null;
  is_bundled: number | null;
  billing_mrr: number | null;
}

export interface BusinessCustomerSegmentRow {
  rfm_segment: string;
  customer_count: number | null;
  avg_spend: number | null;
  avg_orders: number | null;
  avg_days_since_last_order: number | null;
  segment_revenue: number | null;
  at_risk_count: number | null;
  [key: string]: unknown;
}
