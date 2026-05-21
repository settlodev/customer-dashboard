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

export interface BusinessLocationBreakdownRow {
  location_id: string;
  location_name: string | null;
  total_orders: number | null;
  completed_orders: number | null;
  net_sales: number | null;
  gross_profit: number | null;
  avg_order_value: number | null;
  active_staff: number | null;
  unique_customers: number | null;
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
