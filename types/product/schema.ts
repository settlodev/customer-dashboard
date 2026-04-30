import { array, boolean, number, object, preprocess, string, z } from "zod";

const toNumber = (val: unknown) => {
  if (val === null || val === undefined || val === "") return undefined;
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof val === "number") return val;
  return undefined;
};

const toOptionalNumber = (val: unknown) => toNumber(val);

// ── Product Variant ─────────────────────────────────────────────────

export const ProductVariantSchema = object({
  id: string().uuid().optional().nullish(),

  name: string({ required_error: "Variant name is required" })
    .min(1, "Variant name is required"),

  sku: string().optional().nullish(),
  imageUrl: string().optional().nullish(),
  active: boolean().default(true),

  // Sellability mode drives validation across pricing/stock fields.
  // Stored on the form only; mapped to (trackStock, unlimited, stockLinkType)
  // in the action layer.
  sellabilityMode: z.enum(["UNLIMITED", "DIRECT", "RECIPE"]).default("UNLIMITED"),

  // Pricing
  pricingStrategy: z.enum(["MANUAL", "PERCENTAGE_MARKUP", "FIXED_MARKUP"]).default("MANUAL"),
  price: preprocess(
    toNumber,
    number({ message: "Price is required" }).nonnegative("Price cannot be negative"),
  ),
  costPrice: preprocess(toOptionalNumber, number().nonnegative().optional().nullish()),
  markupPercentage: preprocess(toOptionalNumber, number().positive().optional().nullish()),
  markupAmount: preprocess(toOptionalNumber, number().positive().optional().nullish()),

  // UNLIMITED-mode self-managed counter (only used when sellabilityMode=UNLIMITED
  // and the merchant wants a soft cap). When unlimited stays true on the variant
  // entity, this can be left empty.
  availableQuantity: preprocess(toOptionalNumber, number().nonnegative().optional().nullish()),

  // DIRECT-mode wiring
  stockVariantId: string().uuid().optional().nullish(),
  directQuantity: preprocess(toOptionalNumber, number().positive().optional().nullish()),

  // Auto-retire-on-sellout (V36): when true, the backend's order consumer
  // archives this variant the moment its stock hits zero (with
  // archivedReason=SOLD_OUT). Surfaces as a per-variant toggle in the
  // form; only meaningful for tracked variants — UNLIMITED variants
  // ignore the setting since there's nothing to "sell out."
  autoRetireOnSellout: boolean().default(false),
}).superRefine((val, ctx) => {
  // Pricing strategy ⇒ required field per branch
  if (val.pricingStrategy === "PERCENTAGE_MARKUP" && val.markupPercentage == null) {
    ctx.addIssue({
      code: "custom",
      path: ["markupPercentage"],
      message: "Markup percentage is required for percentage markup strategy",
    });
  }
  if (val.pricingStrategy === "FIXED_MARKUP" && val.markupAmount == null) {
    ctx.addIssue({
      code: "custom",
      path: ["markupAmount"],
      message: "Markup amount is required for fixed markup strategy",
    });
  }

  // Cost-price requirement: enforced for UNLIMITED variants because the backend
  // will reject the create otherwise. RECIPE/DIRECT can derive cost from stock.
  if (val.sellabilityMode === "UNLIMITED" && val.costPrice == null) {
    ctx.addIssue({
      code: "custom",
      path: ["costPrice"],
      message: "Cost price is required for unlimited variants",
    });
  }

  // DIRECT requires both fields
  if (val.sellabilityMode === "DIRECT") {
    if (!val.stockVariantId) {
      ctx.addIssue({
        code: "custom",
        path: ["stockVariantId"],
        message: "Pick a stock item to link",
      });
    }
    if (val.directQuantity == null || val.directQuantity <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["directQuantity"],
        message: "Direct quantity must be greater than zero",
      });
    }
  }
});

export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;

// ── Product ─────────────────────────────────────────────────────────

export const ProductSchema = object({
  name: string({ required_error: "Product name is required" })
    .min(2, "Product name must be at least 2 characters"),

  // ISO-4217 3-letter code. Backend defaults to "TZS" if omitted, but the
  // form always emits a value so the merchant sees their pick reflected
  // back when re-loading the product.
  nativeCurrency: string()
    .length(3, "Use the ISO-4217 3-letter code")
    .default("TZS"),

  description: string().optional().nullish(),
  imageUrl: string().optional().nullish(),

  brandId: string().uuid().optional().nullish(),
  // Department now lives on the category (categories optionally carry a
  // department; departments are a paid-tier feature). The form no longer
  // surfaces a department picker for products.
  categoryIds: array(string().uuid()).min(1, "Pick at least one category"),
  tags: array(string()).default([]),

  sellOnline: boolean().default(true),
  taxInclusive: boolean().default(false),
  taxClass: z.enum(["A", "B", "C", "D", "E", "ZANZIBAR"]).optional().nullish(),
  active: boolean().default(true),
  // DRAFT included so the form can round-trip a draft product without
  // tripping the schema parser. The Save-as-Draft / Publish flow is what
  // actually moves a product between DRAFT and ACTIVE; merchants don't
  // pick DRAFT manually from the lifecycle dropdown.
  lifecycleStatus: z
    .enum(["DRAFT", "ACTIVE", "DISCONTINUED", "END_OF_LIFE"])
    .default("ACTIVE"),
  replacementProductId: string().uuid().optional().nullish(),

  variants: array(ProductVariantSchema).min(1, "At least one variant is required"),

  // Library group attachments — set on create only. Existing groups are
  // attached to the product on save; new library groups must be created
  // separately at /modifier-groups or /addon-groups first.
  modifierGroupIds: array(string().uuid()).default([]),
  addonGroupIds: array(string().uuid()).default([]),
}).superRefine((val, ctx) => {
  // No two variants with the same trimmed name (case-insensitive). The backend
  // enforces slug uniqueness; surface a friendlier error pre-submit.
  const seen = new Map<string, number>();
  val.variants.forEach((v, i) => {
    const key = v.name.trim().toLowerCase();
    if (key && seen.has(key)) {
      ctx.addIssue({
        code: "custom",
        path: ["variants", i, "name"],
        message: "Variant names must be unique within a product",
      });
    } else if (key) {
      seen.set(key, i);
    }
  });
});

export type ProductInput = z.infer<typeof ProductSchema>;

// ── Modifier Group + Option ─────────────────────────────────────────

export const ModifierOptionSchema = object({
  id: string().uuid().optional().nullish(),
  name: string({ required_error: "Option name is required" }).min(1),
  priceAdjustment: preprocess(toNumber, number()).default(0),
  isDefault: boolean().default(false),
  stockVariantId: string().uuid().optional().nullish(),
  stockQuantity: preprocess(toOptionalNumber, number().positive().optional().nullish()),
  sortOrder: preprocess(toNumber, number().int().nonnegative()).default(0),
  active: boolean().default(true),
}).superRefine((val, ctx) => {
  if (val.stockVariantId && (val.stockQuantity == null || val.stockQuantity <= 0)) {
    ctx.addIssue({
      code: "custom",
      path: ["stockQuantity"],
      message: "Set how much stock this option consumes",
    });
  }
});

export type ModifierOptionInput = z.infer<typeof ModifierOptionSchema>;

export const ModifierGroupSchema = object({
  id: string().uuid().optional().nullish(),
  name: string({ required_error: "Group name is required" }).min(1),
  selectionType: z.enum(["SINGLE", "MULTI"]).default("SINGLE"),
  minSelections: preprocess(toNumber, number().int().nonnegative()).default(0),
  maxSelections: preprocess(toNumber, number().int().min(1)).default(1),
  sortOrder: preprocess(toNumber, number().int().nonnegative()).default(0),
  active: boolean().default(true),
  options: array(ModifierOptionSchema).default([]),
}).superRefine((val, ctx) => {
  if (val.maxSelections < val.minSelections) {
    ctx.addIssue({
      code: "custom",
      path: ["maxSelections"],
      message: "Max selections must be ≥ min selections",
    });
  }
  if (val.selectionType === "SINGLE" && val.maxSelections > 1) {
    ctx.addIssue({
      code: "custom",
      path: ["maxSelections"],
      message: "SINGLE selection groups allow at most 1 selection",
    });
  }
  // No two options with same name in a group
  const seen = new Set<string>();
  val.options.forEach((o, i) => {
    const k = o.name.trim().toLowerCase();
    if (k && seen.has(k)) {
      ctx.addIssue({
        code: "custom",
        path: ["options", i, "name"],
        message: "Option names must be unique within a group",
      });
    }
    if (k) seen.add(k);
  });
  // At most one default per group
  const defaults = val.options.filter((o) => o.isDefault).length;
  if (defaults > 1) {
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: "Only one option can be marked default",
    });
  }
});

export type ModifierGroupInput = z.infer<typeof ModifierGroupSchema>;

// ── Addon Group + Item ──────────────────────────────────────────────

export const AddonGroupItemSchema = object({
  id: string().uuid().optional().nullish(),
  productVariantId: string({ required_error: "Pick a product variant" }).uuid(),
  priceOverride: preprocess(toOptionalNumber, number().nonnegative().optional().nullish()),
  sortOrder: preprocess(toNumber, number().int().nonnegative()).default(0),
  active: boolean().default(true),
});

export type AddonGroupItemInput = z.infer<typeof AddonGroupItemSchema>;

export const AddonGroupSchema = object({
  id: string().uuid().optional().nullish(),
  name: string({ required_error: "Group name is required" }).min(1),
  minSelections: preprocess(toNumber, number().int().nonnegative()).default(0),
  maxSelections: preprocess(toNumber, number().int().min(1)).default(10),
  sortOrder: preprocess(toNumber, number().int().nonnegative()).default(0),
  active: boolean().default(true),
  items: array(AddonGroupItemSchema).default([]),
}).superRefine((val, ctx) => {
  if (val.maxSelections < val.minSelections) {
    ctx.addIssue({
      code: "custom",
      path: ["maxSelections"],
      message: "Max selections must be ≥ min selections",
    });
  }
});

export type AddonGroupInput = z.infer<typeof AddonGroupSchema>;

// ── Currency Price Override ─────────────────────────────────────────

export const PriceOverrideSchema = object({
  currency: string({ required_error: "Currency is required" })
    .length(3, "Use the ISO-4217 3-letter code")
    .transform((s) => s.toUpperCase()),
  price: preprocess(toNumber, number().positive("Price must be positive")),
  notes: string().optional().nullish(),
});

export type PriceOverrideInput = z.infer<typeof PriceOverrideSchema>;
