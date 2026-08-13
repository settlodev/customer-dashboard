/**
 * Shared enums for the discount domain (Order Management Service).
 * Values match the OMS `/api/v1/discount` Java enums exactly.
 */

export type DiscountRuleType =
  | "PERCENTAGE"
  | "FIXED_AMOUNT"
  | "FREE_ITEM"
  | "BUY_X_GET_Y"
  | "TIERED";

export type DiscountTargetType =
  | "ORDER"
  | "SPECIFIC_PRODUCTS"
  | "SPECIFIC_CATEGORIES"
  | "CHEAPEST_ITEM"
  | "MOST_EXPENSIVE_ITEM";

export type DiscountApplyMode = "AUTO" | "MANUAL" | "COUPON";

export type DiscountConditionType =
  | "MIN_SPEND"
  | "MIN_QUANTITY"
  | "TIME_WINDOW"
  | "DAY_OF_WEEK"
  | "PRODUCT_SCOPE"
  | "CATEGORY_SCOPE"
  | "CUSTOMER_SCOPE"
  | "CUSTOMER_GROUP_SCOPE"
  | "STAFF_ONLY"
  | "PLATFORM_SCOPE"
  | "FIRST_ORDER"
  | "ORDER_TYPE";

export type DiscountTargetEntityType = "PRODUCT" | "PRODUCT_VARIANT" | "CATEGORY";

export type DiscountTierType = "FIXED" | "PERCENTAGE";

export const DISCOUNT_RULE_TYPE_OPTIONS: { value: DiscountRuleType; label: string }[] = [
  { value: "PERCENTAGE", label: "Percentage off" },
  { value: "FIXED_AMOUNT", label: "Fixed amount off" },
  { value: "FREE_ITEM", label: "Free item" },
  { value: "BUY_X_GET_Y", label: "Buy X, get Y" },
  { value: "TIERED", label: "Tiered discount" },
];

export const DISCOUNT_TARGET_TYPE_OPTIONS: { value: DiscountTargetType; label: string }[] = [
  { value: "ORDER", label: "Whole order" },
  { value: "SPECIFIC_PRODUCTS", label: "Specific products" },
  { value: "SPECIFIC_CATEGORIES", label: "Specific categories" },
  { value: "CHEAPEST_ITEM", label: "Cheapest item" },
  { value: "MOST_EXPENSIVE_ITEM", label: "Most expensive item" },
];

export const DISCOUNT_APPLY_MODE_OPTIONS: { value: DiscountApplyMode; label: string }[] = [
  { value: "AUTO", label: "Automatic" },
  { value: "MANUAL", label: "Manual (staff-applied)" },
  { value: "COUPON", label: "Coupon code" },
];

export const DISCOUNT_CONDITION_TYPE_OPTIONS: { value: DiscountConditionType; label: string }[] = [
  { value: "MIN_SPEND", label: "Minimum spend" },
  { value: "MIN_QUANTITY", label: "Minimum quantity" },
  { value: "TIME_WINDOW", label: "Time window" },
  { value: "DAY_OF_WEEK", label: "Day of week" },
  { value: "PRODUCT_SCOPE", label: "Product scope" },
  { value: "CATEGORY_SCOPE", label: "Category scope" },
  { value: "CUSTOMER_SCOPE", label: "Customer scope" },
  { value: "CUSTOMER_GROUP_SCOPE", label: "Customer group scope" },
  { value: "STAFF_ONLY", label: "Staff only" },
  { value: "PLATFORM_SCOPE", label: "Platform scope" },
  { value: "FIRST_ORDER", label: "First order only" },
  { value: "ORDER_TYPE", label: "Order type" },
];

export const DISCOUNT_TARGET_ENTITY_TYPE_OPTIONS: { value: DiscountTargetEntityType; label: string }[] = [
  { value: "PRODUCT", label: "Product" },
  { value: "PRODUCT_VARIANT", label: "Product variant" },
  { value: "CATEGORY", label: "Category" },
];

export const DISCOUNT_TIER_TYPE_OPTIONS: { value: DiscountTierType; label: string }[] = [
  { value: "FIXED", label: "Fixed amount" },
  { value: "PERCENTAGE", label: "Percentage" },
];
