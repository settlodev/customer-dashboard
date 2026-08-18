import { z } from "zod";

const DiscountConditionSchema = z.object({
  conditionType: z.enum([
    "MIN_SPEND",
    "MIN_QUANTITY",
    "TIME_WINDOW",
    "DAY_OF_WEEK",
    "PRODUCT_SCOPE",
    "CATEGORY_SCOPE",
    "CUSTOMER_SCOPE",
    "CUSTOMER_GROUP_SCOPE",
    "STAFF_ONLY",
    "PLATFORM_SCOPE",
    "FIRST_ORDER",
    "ORDER_TYPE",
  ], { required_error: "Condition type is required" }),
  operator: z.string().optional(),
  valueText: z.string().optional(),
  valueNumeric: z.number().optional(),
  valueTimeFrom: z.string().optional(),
  valueTimeTo: z.string().optional(),
  valueIds: z.array(z.string().uuid("Each condition value id must be a valid id")).optional(),
});

const DiscountTargetSchema = z.object({
  targetEntityType: z.enum(["PRODUCT", "PRODUCT_VARIANT", "CATEGORY"], {
    required_error: "Target entity type is required",
  }),
  targetEntityId: z.string().uuid("Please select a valid target entity"),
});

const DiscountTierSchema = z.object({
  minThreshold: z.number({ required_error: "Tier minimum threshold is required" }).min(0),
  discountType: z.enum(["FIXED", "PERCENTAGE"], {
    required_error: "Tier discount type is required",
  }),
  discountValue: z.number({ required_error: "Tier discount value is required" }).min(0),
  sortOrder: z.number().int().min(0).optional(),
});

export const DiscountSchema = z
  .object({
    name: z
      .string({ required_error: "Discount name is required" })
      .min(2, "Discount name must be at least 2 characters"),
    description: z.string().optional(),
    ruleType: z.enum(
      ["PERCENTAGE", "FIXED_AMOUNT", "FREE_ITEM", "BUY_X_GET_Y", "TIERED"],
      { required_error: "Rule type is required" },
    ),
    targetType: z.enum(
      [
        "ORDER",
        "SPECIFIC_PRODUCTS",
        "SPECIFIC_CATEGORIES",
        "CHEAPEST_ITEM",
        "MOST_EXPENSIVE_ITEM",
      ],
      { required_error: "Target type is required" },
    ),
    applyMode: z.enum(["AUTO", "MANUAL", "COUPON"], {
      required_error: "Apply mode is required",
    }),
    value: z.number({ required_error: "Discount value is required" }).min(0),
    maxDiscountAmount: z.number().min(0).optional(),
    couponCode: z.string().optional(),
    stackable: z.boolean().optional().default(true),
    active: z.boolean().optional().default(true),
    priority: z.number().int().min(0).optional().default(0),
    buyQuantity: z.number().int().min(1).optional(),
    getQuantity: z.number().int().min(1).optional(),
    getDiscountPercentage: z.number().min(0).max(100).optional(),
    maxTotalUses: z.number().int().min(0).optional(),
    maxUsesPerCustomer: z.number().int().min(0).optional(),
    maxUsesPerDay: z.number().int().min(0).optional(),
    requiresApproval: z.boolean().optional().default(false),
    promotionId: z.string().uuid("Please select a valid promotion").nullable().optional(),
    conditions: z.array(DiscountConditionSchema).optional().default([]),
    targets: z.array(DiscountTargetSchema).optional().default([]),
    tiers: z.array(DiscountTierSchema).optional().default([]),
    expectedVersion: z.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.ruleType === "PERCENTAGE" && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage discount value cannot exceed 100",
        path: ["value"],
      });
    }

    if (data.applyMode === "COUPON" && !data.couponCode?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Coupon code is required when apply mode is COUPON",
        path: ["couponCode"],
      });
    }

    if (data.ruleType === "BUY_X_GET_Y") {
      if (!data.buyQuantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Buy quantity is required for buy-X-get-Y discounts",
          path: ["buyQuantity"],
        });
      }
      if (!data.getQuantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Get quantity is required for buy-X-get-Y discounts",
          path: ["getQuantity"],
        });
      }
    }

    if (data.ruleType === "TIERED" && data.tiers.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one tier is required for tiered discounts",
        path: ["tiers"],
      });
    }

    if (
      (data.targetType === "SPECIFIC_PRODUCTS" ||
        data.targetType === "SPECIFIC_CATEGORIES") &&
      data.targets.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one target is required for this target type",
        path: ["targets"],
      });
    }
  });
