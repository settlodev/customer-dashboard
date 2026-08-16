import {
  DiscountApplyMode,
  DiscountConditionType,
  DiscountRuleType,
  DiscountTargetEntityType,
  DiscountTargetType,
  DiscountTierType,
} from "./enums";

export interface DiscountCondition {
  id: string;
  conditionType: DiscountConditionType;
  operator: string | null;
  valueText: string | null;
  valueNumeric: number | null;
  valueTimeFrom: string | null;
  valueTimeTo: string | null;
  valueIds: string[] | null;
}

export interface DiscountTarget {
  id: string;
  targetEntityType: DiscountTargetEntityType;
  targetEntityId: string;
}

export interface DiscountTier {
  id: string;
  minThreshold: number;
  discountType: DiscountTierType;
  discountValue: number;
  sortOrder: number;
}

export declare interface Discount {
  id: string;
  promotionId: string | null;
  promotionName: string | null;
  locationId: string;
  name: string;
  description: string | null;
  ruleType: DiscountRuleType;
  targetType: DiscountTargetType;
  applyMode: DiscountApplyMode;
  value: number;
  maxDiscountAmount: number | null;
  couponCode: string | null;
  stackable: boolean;
  active: boolean;
  priority: number;
  buyQuantity: number | null;
  getQuantity: number | null;
  getDiscountPercentage: number | null;
  maxTotalUses: number | null;
  maxUsesPerCustomer: number | null;
  maxUsesPerDay: number | null;
  requiresApproval: boolean;
  conditions: DiscountCondition[];
  targets: DiscountTarget[];
  tiers: DiscountTier[];
  version: number;
  createdAt: string;
  updatedAt: string;
}
