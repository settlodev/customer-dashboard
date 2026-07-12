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
  barcode: string().max(50).optional().nullish(),
  imageUrl: string().optional().nullish(),
  active: boolean().default(true),

  // Sellability mode drives validation across pricing/stock fields.
  // Stored on the form only; mapped to (trackStock, unlimited, stockLinkType)
  // in the action layer. QUANTITY = untracked product with a self-managed
  // counter (variant.unlimited=false, variant.availableQuantity=N).
  sellabilityMode: z.enum(["UNLIMITED", "QUANTITY", "DIRECT", "RECIPE"]).default("UNLIMITED"),

  // Pricing
  pricingStrategy: z.enum(["MANUAL", "PERCENTAGE_MARKUP", "FIXED_MARKUP"]).default("MANUAL"),
  price: preprocess(
    toNumber,
    number({ message: "Price is required" }).nonnegative("Price cannot be negative"),
  ),
  costPrice: preprocess(toOptionalNumber, number().nonnegative().optional().nullish()),
  markupPercentage: preprocess(toOptionalNumber, number().positive().optional().nullish()),
  markupAmount: preprocess(toOptionalNumber, number().positive().optional().nullish()),

  // QUANTITY-mode self-managed counter. The order consumer in the inventory
  // service decrements this on sale (no stock ledger involvement) until it
  // hits zero, after which realtime sales hard-fail with INSUFFICIENT_STOCK.
  // Left empty for UNLIMITED / DIRECT / RECIPE.
  availableQuantity: preprocess(toOptionalNumber, number().nonnegative().optional().nullish()),

  // DIRECT-mode wiring
  stockVariantId: string().uuid().optional().nullish(),
  directQuantity: preprocess(toOptionalNumber, number().positive().optional().nullish()),

  // RECIPE-mode wiring. Lives in form state only — the product backend
  // doesn't take this field. The action fans out attachBomRule(ruleId, {
  // productVariantId }) for each set value after the variant is persisted.
  bomRuleId: string().uuid().optional().nullish(),

  // Auto-retire-on-sellout (V36): when true, the backend's order consumer
  // archives this variant the moment its stock hits zero (with
  // archivedReason=SOLD_OUT). Surfaces as a per-variant toggle in the
  // form; only meaningful for tracked variants — UNLIMITED variants
  // ignore the setting since there's nothing to "sell out."
  autoRetireOnSellout: boolean().default(false),

  // Give-away / free item (e.g. a bottomless refill). Sells at price 0 but still
  // tracks stock; its cost is booked as a give-away, not product COGS. Distinct
  // from the COMPLIMENTARY / in-house tender (a payment concept).
  giveaway: boolean().default(false),

  // Block-from-sale ("Unavailable today"): true blocks staff from selling
  // this variant without pulling it off the menu. Driven product-wide by
  // the Visibility tab's "Block from sale" toggle, which sets this flag
  // identically across every variant — a product is fully blocked only
  // when every variant carries saleLocked=true.
  saleLocked: boolean().default(false),
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

  // Cost-price requirement: enforced for UNLIMITED and QUANTITY variants
  // because the backend has no stock item to derive cost from.
  // RECIPE/DIRECT can derive cost from stock.
  if ((val.sellabilityMode === "UNLIMITED" || val.sellabilityMode === "QUANTITY")
        && val.costPrice == null) {
    ctx.addIssue({
      code: "custom",
      path: ["costPrice"],
      message: "Cost price is required for unlimited and set-quantity variants",
    });
  }

  // QUANTITY requires an initial counter value
  if (val.sellabilityMode === "QUANTITY"
        && (val.availableQuantity == null || val.availableQuantity < 0)) {
    ctx.addIssue({
      code: "custom",
      path: ["availableQuantity"],
      message: "Set the starting quantity (must be zero or more)",
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
  /**
   * Up to 5 image URLs for the product gallery. Element 0 is the
   * cover/thumbnail. Matches the backend's {@code List<String>
   * imageUrls} on Product (cap enforced at the service layer).
   */
  imageUrls: array(string()).max(5, "Up to 5 images per product").default([]),

  brandId: string().uuid().optional().nullish(),
  // Department now lives on the category (categories optionally carry a
  // department; departments are a paid-tier feature). The form no longer
  // surfaces a department picker for products.
  categoryIds: array(string().uuid()).min(1, "Pick at least one category"),
  tags: array(string()).default([]),

  // Sellability schedule. Empty arrays (the default) mean always
  // sellable. sellableWindows scopes selling to specific weekly
  // day/time windows; endTime <= startTime is a valid overnight window
  // (e.g. 22:00–02:00). sellabilityExceptions overrides the weekly
  // windows for a specific calendar date — block a holiday, or open for
  // a one-off event outside the normal windows.
  sellableWindows: array(object({
    dayOfWeek: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]),
    startTime: string(),
    endTime: string(),
  })).default([]),
  sellabilityExceptions: array(object({
    date: string(),
    mode: z.enum(["BLOCKED", "AVAILABLE"]),
    startTime: string().nullish(),
    endTime: string().nullish(),
  })).default([]),

  sellOnline: boolean().default(true),
  // Mirrors the inventory service's per-product default (V70): products are
  // tax-INCLUSIVE unless the merchant opts a product out. Must stay true —
  // the create action always transmits this value, so a false default here
  // silently overrides the backend default and rings the product exclusive.
  taxInclusive: boolean().default(true),
  // FK to a TaxType in the Accounting Service. Owned at the product
  // level: the form fans the same value out to every variant on
  // submit (the inventory service still stores it per-variant). The
  // form auto-picks the business's "A" (Standard Rate) row at mount
  // so merchants always see a sensible default.
  taxTypeId: string({ required_error: "Pick a tax type" }).uuid("Pick a tax type"),
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
  // Mirrors the product variant tracking model:
  //   UNLIMITED → no stock movement when the option is picked
  //   DIRECT    → deduct `directQuantity` of `stockVariantId` per selection
  //   RECIPE    → resolve at sale time via a BOM rule keyed on this option id
  // RECIPE-mode recipes live in /bom rules (which already carry a
  // `modifierOptionId`), so the form only stores the intent here.
  sellabilityMode: z.enum(["UNLIMITED", "DIRECT", "RECIPE"]).default("UNLIMITED"),
  stockVariantId: string().uuid().optional().nullish(),
  directQuantity: preprocess(toOptionalNumber, number().positive().optional().nullish()),
  sortOrder: preprocess(toNumber, number().int().nonnegative()).default(0),
  active: boolean().default(true),
}).superRefine((val, ctx) => {
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
        message: "Quantity per selection must be greater than zero",
      });
    }
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
  options: array(ModifierOptionSchema)
    .min(1, "Add at least one option")
    .default([]),
}).superRefine((val, ctx) => {
  if (val.maxSelections < val.minSelections) {
    ctx.addIssue({
      code: "custom",
      path: ["maxSelections"],
      message: "Max must be ≥ min",
    });
  }
  if (val.selectionType === "SINGLE") {
    if (val.maxSelections !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["maxSelections"],
        message: "Single-choice groups allow exactly 1 selection",
      });
    }
    if (val.minSelections > 1) {
      ctx.addIssue({
        code: "custom",
        path: ["minSelections"],
        message: "Single-choice groups allow at most 1 minimum",
      });
    }
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
  // SINGLE permits at most one default. MULTI permits multiple defaults
  // (each pre-checks an option) up to the group's max selections.
  const defaultsCount = val.options.filter((o) => o.isDefault).length;
  if (val.selectionType === "SINGLE" && defaultsCount > 1) {
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: "Only one option can be marked default",
    });
  }
  // Pre-selected defaults must fit inside the selection bounds — a group
  // that pre-selects 4 options but caps at 2 fails at runtime.
  if (defaultsCount > val.maxSelections) {
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: `You have ${defaultsCount} default${defaultsCount === 1 ? "" : "s"} but the group allows at most ${val.maxSelections}`,
    });
  }
  // Single-required groups must commit to a default once any options
  // exist — otherwise the customer sees the group with nothing checked
  // and we have no way to satisfy minSelections=1.
  if (
    val.selectionType === "SINGLE" &&
    val.minSelections >= 1 &&
    val.options.length > 0 &&
    defaultsCount === 0
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: "Pick a default option — this group requires a selection",
    });
  }
});

export type ModifierGroupInput = z.infer<typeof ModifierGroupSchema>;

// ── Addon Group + Item ──────────────────────────────────────────────

export const AddonGroupItemSchema = object({
  id: string().uuid().optional().nullish(),
  productVariantId: string({ required_error: "Pick a product variant" }).uuid(),
  priceOverride: preprocess(toOptionalNumber, number().nonnegative().optional().nullish()),
  isDefault: boolean().default(false),
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
  items: array(AddonGroupItemSchema)
    .min(1, "Add at least one item")
    .default([]),
}).superRefine((val, ctx) => {
  if (val.maxSelections < val.minSelections) {
    ctx.addIssue({
      code: "custom",
      path: ["maxSelections"],
      message: "Max must be ≥ min",
    });
  }
  // No duplicate variants in the same group — the backend's partial
  // unique index would reject this anyway, so catch it before we POST.
  const seen = new Set<string>();
  val.items.forEach((it, i) => {
    if (it.productVariantId && seen.has(it.productVariantId)) {
      ctx.addIssue({
        code: "custom",
        path: ["items", i, "productVariantId"],
        message: "This variant is already in the group",
      });
    }
    if (it.productVariantId) seen.add(it.productVariantId);
  });
  // Pre-selected defaults must fit inside the selection bounds — a
  // group that ships with 5 defaults but caps at 3 would fail at
  // checkout the first time a customer opens it.
  const defaultsCount = val.items.filter((i) => i.isDefault).length;
  if (defaultsCount > val.maxSelections) {
    ctx.addIssue({
      code: "custom",
      path: ["items"],
      message: `You have ${defaultsCount} default${defaultsCount === 1 ? "" : "s"} but the group allows at most ${val.maxSelections}`,
    });
  }
  // A required group (min ≥ 1) needs at least min defaults so the
  // bundled state is valid out of the box.
  if (val.minSelections >= 1 && defaultsCount < val.minSelections) {
    ctx.addIssue({
      code: "custom",
      path: ["items"],
      message: `Pre-select at least ${val.minSelections} item${val.minSelections === 1 ? "" : "s"} so this required group ships in a valid state`,
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
