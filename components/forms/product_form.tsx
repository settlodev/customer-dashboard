"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useForm, useFieldArray, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Sparkles,
  Package,
  DollarSign,
  Settings2,
  Globe,
  Info,
  Save,
  Tag as TagIcon,
  CheckCircle2,
  FileText,
  X as XIcon,
  ArrowUpFromLine,
  ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { NumericFormat } from "react-number-format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MultiSelect } from "@/components/ui/multi-select";

import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogIcon,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

import styles from "./styles/form-shell.module.css";

import type {
  Product,
  ProductVariant,
  ModifierGroup,
  AddonGroup,
  PriceOverrideResponse,
} from "@/types/product/type";
import {
  ProductSchema,
  type ProductInput,
  type ProductVariantInput,
} from "@/types/product/schema";
import {
  TAX_CLASS_OPTIONS,
  LIFECYCLE_STATUS_OPTIONS,
  PRICING_STRATEGY_OPTIONS,
  CURRENCY_OPTIONS,
} from "@/types/catalogue/enums";

import {
  createProduct,
  createProductWithStock,
  updateProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  generateAIDescription,
  listPriceOverrides,
  upsertPriceOverride,
  removePriceOverride,
  uploadProductImages,
  saveProductDraft,
} from "@/lib/actions/product-actions";
import {
  listModifierGroups,
  listProductModifierGroups,
  attachModifierGroup,
  detachModifierGroup,
} from "@/lib/actions/modifier-actions";
import {
  listAddonGroups,
  listProductAddonGroups,
  attachAddonGroup,
  detachAddonGroup,
} from "@/lib/actions/addon-actions";
import { fetchAllBrands } from "@/lib/actions/brand-actions";
import { fetchAllCategories } from "@/lib/actions/category-actions";
import { getStocks } from "@/lib/actions/stock-actions";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import type { FormResponse } from "@/types/types";

interface ProductFormProps {
  item: Product | null | undefined;
}

interface StockVariantOption {
  id: string;
  label: string;
  unitAbbreviation: string;
}

// Default variant — UNLIMITED ("no tracking") is the simplest default. The
// name is set to "Default" so the single-variant create flow can hide the
// variant-name field entirely while still satisfying the schema's required
// non-empty constraint.
const DEFAULT_VARIANT: ProductVariantInput = {
  name: "Default",
  sku: "",
  imageUrl: "",
  active: true,
  sellabilityMode: "UNLIMITED",
  pricingStrategy: "MANUAL",
  price: 0,
  costPrice: undefined,
  markupPercentage: undefined,
  markupAmount: undefined,
  availableQuantity: undefined,
  stockVariantId: undefined,
  directQuantity: undefined,
};

function variantToInput(v: ProductVariant): ProductVariantInput {
  let mode: "UNLIMITED" | "DIRECT" | "RECIPE";
  if (v.unlimited) mode = "UNLIMITED";
  else if (v.stockLinkType === "DIRECT") mode = "DIRECT";
  else mode = "RECIPE";

  return {
    id: v.id,
    name: v.name,
    sku: v.sku ?? "",
    imageUrl: v.imageUrl ?? "",
    active: v.active,
    sellabilityMode: mode,
    pricingStrategy: v.pricingStrategy,
    price: v.price,
    costPrice: v.costPrice ?? undefined,
    markupPercentage: v.markupPercentage ?? undefined,
    markupAmount: v.markupAmount ?? undefined,
    availableQuantity: v.availableQuantity ?? undefined,
    stockVariantId: v.stockVariantId ?? undefined,
    directQuantity: v.directQuantity ?? undefined,
  };
}

export default function ProductForm({ item }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse>();
  const [removedVariantIds, setRemovedVariantIds] = useState<string[]>([]);

  const isEditMode = !!item;

  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [stockVariants, setStockVariants] = useState<StockVariantOption[]>([]);
  // Map of stockVariantId → weighted-average cost at the current location.
  // Used by the variant editor to derive a variant's cost when DIRECT mode
  // picks a stock item. The cost in inventory uses the same weighted average
  // that the backend's BatchConsumptionResult emits at sale time, so what the
  // merchant sees here is what they'll get charged on average.
  const [stockVariantCosts, setStockVariantCosts] = useState<
    Record<string, number>
  >({});

  const [activeTab, setActiveTab] = useState<string>("pricing");

  // ── Auto-create stock toggle ───────────────────────────────────────
  // Default ON in create mode. When ON, the form hides per-variant
  // stock-tracking pickers and submits to /products/with-stock so the
  // backend creates a 1:1 stock item alongside the product. Always
  // false in edit mode — auto-create is a creation-time concept.
  const [autoCreateStock, setAutoCreateStock] = useState<boolean>(
    () => !item,
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAllBrands().catch(() => []),
      fetchAllCategories().catch(() => []),
      getStocks().catch(() => []),
      getCurrentLocation().catch(() => null),
    ]).then(async ([b, c, s, loc]) => {
      if (cancelled) return;
      setBrands((b ?? []).map((x: any) => ({ id: x.id, name: x.name })));
      setCategories((c ?? []).map((x: any) => ({ id: x.id, name: x.name })));
      const sv: StockVariantOption[] = [];
      for (const stock of s ?? []) {
        for (const v of stock.variants ?? []) {
          if (v.archived) continue;
          sv.push({
            id: v.id,
            label: `${stock.name} — ${v.name}`,
            unitAbbreviation: v.unitAbbreviation,
          });
        }
      }
      setStockVariants(sv);

      // Inventory balances carry both the leading-batch cost and the
      // weighted-average. Prefer currentBatchCost — that's what the system
      // would actually charge from the next FEFO/FIFO consumption — and
      // fall back to averageCost only when no batch info is available
      // (e.g. legacy stock without batches).
      if (loc?.id) {
        try {
          const balances = await getBalancesByLocation(loc.id);
          if (cancelled) return;
          const costMap: Record<string, number> = {};
          for (const bal of balances ?? []) {
            if (!bal?.stockVariantId) continue;
            const unitCost = bal.currentBatchCost ?? bal.averageCost;
            if (unitCost != null) {
              costMap[bal.stockVariantId] = unitCost;
            }
          }
          setStockVariantCosts(costMap);
        } catch {
          /* ignore — cost stays empty until merchant picks/edits manually */
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isEditMode, item]);

  const form = useForm<ProductInput>({
    resolver: zodResolver(ProductSchema),
    defaultValues: item
      ? {
          name: item.name,
          nativeCurrency: item.nativeCurrency ?? "TZS",
          description: item.description ?? "",
          imageUrl: item.imageUrl ?? "",
          brandId: item.brandId ?? undefined,
          categoryIds: item.categories?.map((c) => c.id) ?? [],
          tags: item.tags ?? [],
          sellOnline: item.sellOnline,
          taxInclusive: item.taxInclusive,
          taxClass: item.taxClass ?? undefined,
          active: item.active,
          lifecycleStatus: item.lifecycleStatus,
          replacementProductId: item.replacementProductId ?? undefined,
          variants: (item.variants ?? []).map(variantToInput),
        }
      : {
          name: "",
          nativeCurrency: "TZS",
          description: "",
          imageUrl: "",
          brandId: undefined,
          categoryIds: [],
          tags: [],
          sellOnline: true,
          taxInclusive: false,
          taxClass: undefined,
          active: true,
          lifecycleStatus: "ACTIVE",
          replacementProductId: undefined,
          variants: [DEFAULT_VARIANT],
          modifierGroupIds: [],
          addonGroupIds: [],
        },
  });

  const variantsArray = useFieldArray({
    control: form.control,
    name: "variants",
    keyName: "_key",
  });

  const isMultiVariant = variantsArray.fields.length > 1;

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.warn("Product form validation errors", errors);
    if (errors.variants) {
      setActiveTab("pricing");
      return;
    }
    const taxFields = [
      "taxClass",
      "taxInclusive",
      "sellOnline",
      "lifecycleStatus",
      "active",
      "replacementProductId",
    ];
    if (taxFields.some((f) => (errors as Record<string, unknown>)[f])) {
      setActiveTab("tax");
    }
  }, []);

  const submit = (values: ProductInput) => {
    setResponse(undefined);
    startTransition(async () => {
      try {
        if (!isEditMode) {
          const result = autoCreateStock
            ? await createProductWithStock(values, {
                materialType: "FINISHED_GOOD",
              })
            : await createProduct(values);
          if (result?.responseType === "error") setResponse(result);
          return;
        }

        const productResult = await updateProduct(item!.id, values);
        if (productResult?.responseType === "error") {
          setResponse(productResult);
          return;
        }

        for (const v of values.variants) {
          if (v.id) {
            await updateVariant(item!.id, v.id, v);
          } else {
            await createVariant(item!.id, v);
          }
        }
        for (const removedId of removedVariantIds) {
          await deleteVariant(item!.id, removedId);
        }
        setRemovedVariantIds([]);

        toast({ title: "Saved", description: "Product updated successfully." });
        router.refresh();
      } catch (e: any) {
        if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e;
        setResponse({
          responseType: "error",
          message: e?.message ?? "Failed to save product",
          error: e instanceof Error ? e : new Error(String(e)),
        });
      }
    });
  };

  const removeVariant = (index: number) => {
    const variant = form.getValues(`variants.${index}`);
    if (variant.id) {
      setRemovedVariantIds((prev) => [...prev, variant.id!]);
    }
    variantsArray.remove(index);
  };

  const handleAddVariant = () => {
    // When promoting from single → multi, the existing "Default" name reads
    // awkward. Rename it to "Variant 1" so the user has a sensible label to
    // edit. The newly-appended variant takes "Variant {n}" automatically.
    const next = variantsArray.fields.length + 1;
    if (variantsArray.fields.length === 1) {
      const current = form.getValues("variants.0");
      if (current?.name === "Default" || !current?.name) {
        form.setValue("variants.0.name", "Variant 1");
      }
    }
    variantsArray.append({ ...DEFAULT_VARIANT, name: `Variant ${next}` });
  };

  const handleGenerateDescription = useCallback(async () => {
    const name = form.getValues("name");
    const categoryIds = form.getValues("categoryIds");
    if (!name || !categoryIds?.length) {
      toast({
        variant: "destructive",
        title: "Need a name and category",
        description:
          "Set the product name and at least one category before generating.",
      });
      return;
    }
    const cat = categories.find((c) => c.id === categoryIds[0]);
    if (!cat) return;
    try {
      const desc = await generateAIDescription(name, cat.name);
      form.setValue("description", desc);
      toast({
        title: "Description generated",
        description: "Review and edit as needed.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "Try again in a moment.",
      });
    }
  }, [categories, form, toast]);

  // ── Image gallery ──────────────────────────────────────────────────
  // Up to 5 images with a primary index. Only the primary image's URL is
  // persisted today (synced into form.imageUrl); additional images stay
  // client-only until the backend supports a gallery — see uploadProductImages
  // stub in lib/actions/product-actions.tsx.
  const [galleryImages, setGalleryImages] = useState<
    Array<{ name: string; size: number; type: string; dataUrl: string }>
  >([]);
  const [primaryIdx, setPrimaryIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Seed the gallery from the product's existing imageUrl in edit mode so
  // the merchant sees their current image rather than an empty drop zone.
  useEffect(() => {
    if (!item?.imageUrl) return;
    setGalleryImages((prev) => {
      if (prev.length) return prev;
      return [
        {
          name: "current image",
          size: 0,
          type: "image/*",
          dataUrl: item.imageUrl ?? "",
        },
      ];
    });
  }, [item]);

  const handleFiles = useCallback(
    (files: FileList | File[] | null | undefined) => {
      if (!files) return;
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!arr.length) return;
      Promise.all(
        arr.map(
          (f) =>
            new Promise<{
              name: string;
              size: number;
              type: string;
              dataUrl: string;
            }>((res, rej) => {
              const r = new FileReader();
              r.onload = (e) =>
                res({
                  name: f.name,
                  size: f.size,
                  type: f.type,
                  dataUrl: (e.target?.result as string) ?? "",
                });
              r.onerror = () => rej(r.error);
              r.readAsDataURL(f);
            }),
        ),
      )
        .then(async (loaded) => {
          // Pipe through the stub upload action so swapping it for a real
          // multipart POST later only changes the action body. The stub
          // echoes the data URLs unchanged.
          const urls = await uploadProductImages(loaded.map((l) => l.dataUrl));
          const merged = loaded.map((l, i) => ({
            ...l,
            dataUrl: urls[i] ?? l.dataUrl,
          }));
          setGalleryImages((prev) => [...prev, ...merged].slice(0, 5));
        })
        .catch(() => {
          toast({
            variant: "destructive",
            title: "Couldn't read image",
            description: "Try a different file.",
          });
        });
    },
    [toast],
  );

  const removeImage = useCallback(
    (e: React.MouseEvent | undefined, i: number) => {
      e?.stopPropagation();
      setGalleryImages((prev) => prev.filter((_, idx) => idx !== i));
      setPrimaryIdx((p) => (p >= i ? Math.max(0, p - 1) : p));
    },
    [],
  );

  // Sync the primary image's URL into the form's imageUrl field. Additional
  // gallery images stay client-only — wire them up when the backend gallery
  // schema lands.
  useEffect(() => {
    const primary = galleryImages[primaryIdx];
    form.setValue("imageUrl", primary?.dataUrl ?? "", { shouldDirty: true });
  }, [galleryImages, primaryIdx, form]);

  // ── Validation gating for the "Create product" button ──────────────
  // Mirrors the design's 4-step readiness checklist: name + category +
  // selling price + stock rule (where "stock rule" means UNLIMITED, RECIPE,
  // or DIRECT-with-stock-item).
  const watchedName = form.watch("name");
  const watchedCategoryIds = form.watch("categoryIds");
  const watchedVariants = form.watch("variants");
  const firstVariant = watchedVariants?.[0];
  // When autoCreateStock is on, the backend creates a fresh stock item
  // with a 1:1 link, so no stockVariantId is required up front. Treat
  // the stock rule as satisfied for the readiness checklist.
  const stockRuleSatisfied =
    autoCreateStock ||
    firstVariant?.sellabilityMode === "UNLIMITED" ||
    firstVariant?.sellabilityMode === "RECIPE" ||
    (firstVariant?.sellabilityMode === "DIRECT" &&
      !!firstVariant?.stockVariantId &&
      (firstVariant?.directQuantity ?? 0) > 0);
  const requiredFilled = useMemo(
    () => [
      !!watchedName?.trim(),
      !!watchedCategoryIds?.length,
      (firstVariant?.price ?? 0) > 0,
      stockRuleSatisfied,
    ],
    [watchedName, watchedCategoryIds, firstVariant?.price, stockRuleSatisfied],
  );
  const completion = Math.round(
    (requiredFilled.filter(Boolean).length / requiredFilled.length) * 100,
  );
  const isValid = requiredFilled.every(Boolean);
  const remainingFields = requiredFilled.filter((v) => !v).length;

  // Mapped category names for the live preview meta line. Resolves IDs
  // against the loaded category list, falling back to the first selected
  // category's UUID if the list hasn't loaded yet.
  const categoryDisplayNames = useMemo(() => {
    if (!watchedCategoryIds?.length) return [];
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return watchedCategoryIds
      .map((id) => map.get(id))
      .filter((n): n is string => !!n);
  }, [watchedCategoryIds, categories]);

  // Autosave timestamp for the sticky footer indicator. Re-renders every
  // minute so the displayed time stays roughly current; real autosave
  // wiring is a separate concern.
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(i);
  }, []);

  const handleSaveAsDraft = useCallback(() => {
    startTransition(async () => {
      const result = await saveProductDraft(form.getValues(), item?.id);
      if (result?.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Drafts not yet wired up",
          description: result.message,
        });
      } else {
        toast({ title: "Draft saved" });
      }
    });
  }, [form, item?.id, toast]);

  // Discard navigation runs straight from the AlertDialog's confirm
  // button below, so this used to be a confirm() guard — kept the
  // handler shape simple now that the modal owns the "are you sure?"
  // step.
  const handleDiscard = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <Form {...form}>
      {response?.responseType === "error" && response?.message ? (
        <Alert tone="danger" className="mb-3">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>We couldn&apos;t save this product</AlertTitle>
            <AlertDescription>{response.message}</AlertDescription>
          </AlertBody>
        </Alert>
      ) : null}
      <form
        onSubmit={form.handleSubmit(submit, onInvalid)}
        className={styles.formRoot}
      >
        <div className={styles.formGrid}>
          {/* ── LEFT — form column ─────────────────────────────── */}
          <div className={styles.formStack}>
            {/* Product details */}
            <section className={styles.formCard}>
              <header className={styles.formCardHead}>
                <div className={styles.icoBox}>
                  <Package className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3>Product details</h3>
                  <p className={styles.formCardHeadDesc}>
                    Basic information shown across the catalog.
                  </p>
                </div>
                <div className={styles.formCardActions}>
                  <span className={styles.stepBadge}>STEP 01</span>
                </div>
              </header>

              <div className={styles.formBody}>
                {/* Name (span 2) + Currency + Brand on a 4-col grid */}
                <div
                  className={styles.fieldRow}
                  style={{ ["--cols" as never]: 4 } as React.CSSProperties}
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2 min-w-0">
                        <FormLabel className={styles.fieldLabel}>
                          Product name <span className="req">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className={styles.inputWithPrefix}>
                            <span className={styles.inputPrefix}>
                              <Package className="h-3.5 w-3.5" />
                            </span>
                            <Input
                              placeholder="e.g. Cappuccino, Fish & Chips"
                              {...field}
                              disabled={isPending}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nativeCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={styles.fieldLabel}>
                          Currency
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "TZS"}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="TZS" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCY_OPTIONS.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={styles.fieldLabel}>
                          Brand
                        </FormLabel>
                        <Select
                          onValueChange={(v) =>
                            field.onChange(v === "__none__" ? undefined : v)
                          }
                          value={field.value ?? "__none__"}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="No brand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">No brand</SelectItem>
                            {brands.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Categories (full row) */}
                <div
                  className={styles.fieldRow}
                  style={
                    {
                      ["--cols" as never]: 1,
                      marginTop: 14,
                    } as React.CSSProperties
                  }
                >
                  <FormField
                    control={form.control}
                    name="categoryIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={styles.fieldLabel}>
                          Categories <span className="req">*</span>
                        </FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={categories.map((c) => ({
                              label: c.name,
                              value: c.id,
                            }))}
                            onValueChange={field.onChange}
                            defaultValue={field.value ?? []}
                            placeholder="Pick at least one category"
                            maxCount={5}
                          />
                        </FormControl>
                        {!field.value?.length && (
                          <p className={styles.fieldHint}>
                            Categorisation drives reports, addons, and tax
                            rules.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tags */}
                <div
                  className={styles.fieldRow}
                  style={
                    {
                      ["--cols" as never]: 1,
                      marginTop: 14,
                    } as React.CSSProperties
                  }
                >
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={styles.fieldLabel}>
                          Tags
                          <span className="opt">
                            {(field.value ?? []).length} ADDED
                          </span>
                        </FormLabel>
                        <FormControl>
                          <ChipTagsInput
                            tags={field.value ?? []}
                            onChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <div
                  className={styles.fieldRow}
                  style={
                    {
                      ["--cols" as never]: 1,
                      marginTop: 14,
                    } as React.CSSProperties
                  }
                >
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={styles.fieldLabel}>
                          Description
                          <button
                            type="button"
                            className={styles.generateLink}
                            onClick={handleGenerateDescription}
                            disabled={isPending}
                          >
                            <Sparkles className="h-3 w-3" /> GENERATE
                          </button>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What is this product?"
                            rows={3}
                            {...field}
                            value={field.value ?? ""}
                            disabled={isPending}
                            maxLength={500}
                          />
                        </FormControl>
                        <p className={styles.fieldHint}>
                          <span className={styles.descCount}>
                            {(field.value?.length ?? 0)}/500
                          </span>
                          {" · Used on receipts and online menu."}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </section>

            {/* Tabs section */}
            <section className={styles.formCard}>
              <div className={styles.formTabs} role="tablist">
                {(
                  [
                    {
                      id: "pricing",
                      label: "Pricing & stock",
                      icon: <DollarSign className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "modifiers",
                      label: "Modifiers",
                      icon: <Settings2 className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "addons",
                      label: "Addons",
                      icon: <TagIcon className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "overrides",
                      label: "Currency overrides",
                      icon: <Globe className="h-3.5 w-3.5" />,
                    },
                    {
                      id: "tax",
                      label: "Tax & visibility",
                      icon: <Settings2 className="h-3.5 w-3.5" />,
                    },
                  ] as const
                ).map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    role="tab"
                    aria-selected={activeTab === t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`${styles.formTab} ${
                      activeTab === t.id ? styles.formTabOn : ""
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Pricing & stock */}
              {activeTab === "pricing" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <DollarSign className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>{isMultiVariant ? "Variants" : "Pricing & stock"}</h3>
                      <p className={styles.formCardHeadDesc}>
                        {isMultiVariant
                          ? "Each variant has its own price, cost and stock setup."
                          : "Set price and cost. Add variants if this product comes in multiple sizes or options."}
                      </p>
                    </div>
                    <div className={styles.formCardActions}>
                      <span className={styles.stepBadge}>STEP 02</span>
                      {isMultiVariant && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddVariant}
                          disabled={isPending}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add variant
                        </Button>
                      )}
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    {!isEditMode && (
                      <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <div className="space-y-0.5 min-w-0">
                          <FormLabel className="text-sm font-medium text-foreground">
                            Auto-create stock item
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Creates a matching stock item with a 1:1 link per
                            variant so deductions just work. Switch off to
                            link an existing stock item, use a recipe, or
                            sell without inventory.
                          </p>
                        </div>
                        <Switch
                          checked={autoCreateStock}
                          onCheckedChange={(next) => {
                            setAutoCreateStock(next);
                            if (next) {
                              // Reset each variant to UNLIMITED so Zod's
                              // "DIRECT requires stockVariantId" rule doesn't
                              // trip while the picker is hidden. The submit
                              // handler converts these to DIRECT in the
                              // /products/with-stock payload.
                              const vs = form.getValues("variants") ?? [];
                              vs.forEach((v, i) => {
                                if (v.sellabilityMode !== "UNLIMITED") {
                                  form.setValue(
                                    `variants.${i}.sellabilityMode`,
                                    "UNLIMITED",
                                    { shouldValidate: false },
                                  );
                                  form.setValue(
                                    `variants.${i}.stockVariantId`,
                                    undefined,
                                    { shouldValidate: false },
                                  );
                                  form.setValue(
                                    `variants.${i}.directQuantity`,
                                    undefined,
                                    { shouldValidate: false },
                                  );
                                }
                              });
                            }
                          }}
                          disabled={isPending}
                        />
                      </div>
                    )}

                    {isMultiVariant ? (
                      <div className="space-y-3">
                        {variantsArray.fields.map((field, index) => (
                          <VariantEditor
                            key={field._key}
                            index={index}
                            form={form}
                            onRemove={() => removeVariant(index)}
                            stockVariants={stockVariants}
                            stockVariantCosts={stockVariantCosts}
                            disabled={isPending}
                            showHeader
                            canRemove
                            autoCreateStock={autoCreateStock}
                          />
                        ))}
                      </div>
                    ) : (
                      <VariantEditor
                        index={0}
                        form={form}
                        onRemove={() => {}}
                        stockVariants={stockVariants}
                        stockVariantCosts={stockVariantCosts}
                        disabled={isPending}
                        showHeader={false}
                        canRemove={false}
                        autoCreateStock={autoCreateStock}
                      />
                    )}

                    {!isMultiVariant && (
                      <div className="pt-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleAddVariant}
                          disabled={isPending}
                          style={{ color: "var(--pf-primary)" }}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add another
                          variant
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Modifiers */}
              {activeTab === "modifiers" && (
                <div className={styles.formBody}>
                  {isEditMode ? (
                    <ProductModifierGroupsSection productId={item!.id} />
                  ) : (
                    <NewProductLibraryPicker
                      kind="modifier"
                      value={form.watch("modifierGroupIds") ?? []}
                      onChange={(ids) =>
                        form.setValue("modifierGroupIds", ids, {
                          shouldDirty: true,
                        })
                      }
                    />
                  )}
                </div>
              )}

              {/* Addons */}
              {activeTab === "addons" && (
                <div className={styles.formBody}>
                  {isEditMode ? (
                    <ProductAddonGroupsSection productId={item!.id} />
                  ) : (
                    <NewProductLibraryPicker
                      kind="addon"
                      value={form.watch("addonGroupIds") ?? []}
                      onChange={(ids) =>
                        form.setValue("addonGroupIds", ids, {
                          shouldDirty: true,
                        })
                      }
                    />
                  )}
                </div>
              )}

              {/* Currency overrides */}
              {activeTab === "overrides" && (
                <div className={styles.formBody}>
                  {isEditMode && item!.variants.length > 0 ? (
                    <PriceOverridesSection
                      productId={item!.id}
                      variants={item!.variants}
                    />
                  ) : (
                    <SaveFirstPlaceholder>
                      Set per-currency price overrides for each variant. Save
                      the product first to manage overrides.
                    </SaveFirstPlaceholder>
                  )}
                </div>
              )}

              {/* Tax & visibility (+ Lifecycle in edit) */}
              {activeTab === "tax" && (
                <>
                  <header
                    className={styles.formCardHead}
                    style={{ borderTop: "1px solid var(--pf-line)" }}
                  >
                    <div className={styles.icoBox}>
                      <Settings2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3>Tax & visibility</h3>
                      <p className={styles.formCardHeadDesc}>
                        How this product is taxed and where it appears.
                      </p>
                    </div>
                  </header>
                  <div className={styles.formBody}>
                    <div
                      className={styles.fieldRow}
                      style={
                        { ["--cols" as never]: 3 } as React.CSSProperties
                      }
                    >
                      <FormField
                        control={form.control}
                        name="taxClass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={styles.fieldLabel}>
                              Tax class
                            </FormLabel>
                            <Select
                              onValueChange={(v) =>
                                field.onChange(
                                  v === "__none__" ? undefined : v,
                                )
                              }
                              value={field.value ?? "__none__"}
                              disabled={isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="None" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="__none__">None</SelectItem>
                                {TAX_CLASS_OPTIONS.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="taxInclusive"
                        render={({ field }) => (
                          <FormItem className={styles.toggleRow}>
                            <div>
                              <div className="l">Tax inclusive</div>
                              <div className="h">
                                Price already includes tax
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isPending}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sellOnline"
                        render={({ field }) => (
                          <FormItem className={styles.toggleRow}>
                            <div>
                              <div className="l">Sell online</div>
                              <div className="h">
                                Visible in the online catalog
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isPending}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {isEditMode && (
                      <>
                        <div
                          style={{
                            margin: "20px 0 14px",
                            paddingTop: 18,
                            borderTop: "1px solid var(--pf-line)",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12,
                          }}
                        >
                          <div className={styles.icoBox}>
                            <Globe className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: 14,
                                fontWeight: 600,
                                letterSpacing: "-0.01em",
                              }}
                            >
                              Lifecycle
                            </h3>
                            <p className={styles.formCardHeadDesc}>
                              Status and replacement behavior.
                            </p>
                          </div>
                        </div>

                        <div
                          className={styles.fieldRow}
                          style={
                            { ["--cols" as never]: 2 } as React.CSSProperties
                          }
                        >
                          <FormField
                            control={form.control}
                            name="lifecycleStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={styles.fieldLabel}>
                                  Status
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  disabled={isPending}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {LIFECYCLE_STATUS_OPTIONS.map((o) => (
                                      <SelectItem
                                        key={o.value}
                                        value={o.value}
                                      >
                                        {o.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                              <FormItem className={styles.toggleRow}>
                                <div>
                                  <div className="l">Active</div>
                                  <div className="h">
                                    Inactive products are hidden in the POS
                                  </div>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isPending}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>

          {/* ── RIGHT — preview + media (optional) ───────────── */}
          <aside className={styles.formStack}>
            <LivePreviewCard
              name={watchedName ?? ""}
              categoryNames={categoryDisplayNames}
              sellPrice={firstVariant?.price ?? 0}
              currency={form.watch("nativeCurrency") || "TZS"}
              primaryImageUrl={galleryImages[primaryIdx]?.dataUrl}
              checklist={[
                { label: "Product name", done: requiredFilled[0] },
                { label: "Category", done: requiredFilled[1] },
                { label: "Selling price", done: requiredFilled[2] },
                { label: "Stock rule", done: requiredFilled[3] },
              ]}
              completion={completion}
            />

            <MediaCard
              images={galleryImages}
              primaryIdx={primaryIdx}
              setPrimaryIdx={setPrimaryIdx}
              handleFiles={handleFiles}
              removeImage={removeImage}
              dragOver={dragOver}
              setDragOver={setDragOver}
              fileInputRef={fileInputRef}
            />
          </aside>
        </div>

        {/* Sticky autosave footer */}
        <div className={styles.formFoot}>
          <div className={styles.formFootSaveState}>
            <span className={styles.liveDot} />
            AUTOSAVED ·{" "}
            {now.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div className={styles.formFootSpacer} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                title="Discard draft and go back"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent tone="danger">
              <AlertDialogIcon>
                <Trash2 className="h-5 w-5" />
              </AlertDialogIcon>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this draft?</AlertDialogTitle>
                <AlertDialogDescription>
                  Unsaved changes since the last autosave will be lost. This
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction onClick={handleDiscard}>
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveAsDraft}
            disabled={isPending}
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Save as draft
          </Button>
          <Button
            type="submit"
            disabled={isPending || !isValid}
            title={
              isValid
                ? isEditMode
                  ? "Save changes"
                  : autoCreateStock
                    ? "Create product + stock"
                    : "Create product"
                : `Complete required fields (${remainingFields} remaining)`
            }
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {isEditMode
              ? "Save changes"
              : autoCreateStock
                ? "Create product + stock"
                : "Create product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Placeholder shown in tabs that need a saved product
// ─────────────────────────────────────────────────────────────────────

function SaveFirstPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center text-center gap-2">
        <Info className="h-8 w-8 text-muted-foreground/60" />
        <h3 className="font-medium">Save the product first</h3>
        <p className="text-sm text-muted-foreground max-w-md">{children}</p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Variant editor — single component that adapts to single vs multi variant
// ─────────────────────────────────────────────────────────────────────

interface VariantEditorProps {
  index: number;
  form: ReturnType<typeof useForm<ProductInput>>;
  onRemove: () => void;
  stockVariants: StockVariantOption[];
  stockVariantCosts: Record<string, number>;
  disabled: boolean;
  showHeader: boolean;
  canRemove: boolean;
  /**
   * When true, the parent form is in "auto-create matching stock" mode:
   * the per-variant Track-stock toggle and stockVariantId / sellabilityMode
   * pickers are hidden. The backend will create the stock variant and link
   * it 1:1 on submit.
   */
  autoCreateStock?: boolean;
}

function VariantEditor({
  index,
  form,
  onRemove,
  stockVariants,
  stockVariantCosts,
  disabled,
  showHeader,
  canRemove,
  autoCreateStock = false,
}: VariantEditorProps) {
  const mode = form.watch(`variants.${index}.sellabilityMode`);
  const pricingStrategy = form.watch(`variants.${index}.pricingStrategy`);
  const costPrice = form.watch(`variants.${index}.costPrice`);
  const markupPercentage = form.watch(`variants.${index}.markupPercentage`);
  const markupAmount = form.watch(`variants.${index}.markupAmount`);
  const stockVariantId = form.watch(`variants.${index}.stockVariantId`);
  const directQuantity = form.watch(`variants.${index}.directQuantity`);
  const currency = form.watch("nativeCurrency") || "TZS";
  const currencySuffix = ` ${currency}`;
  const tracksStock = mode !== "UNLIMITED";
  const isMarkupMode =
    pricingStrategy === "PERCENTAGE_MARKUP" ||
    pricingStrategy === "FIXED_MARKUP";

  // Toggling the master "Track stock" switch flips between UNLIMITED (off)
  // and DIRECT (on, default to direct stock link). Switching to RECIPE
  // happens via the inner radio after enabling tracking.
  const handleTrackToggle = (track: boolean) => {
    if (track) {
      form.setValue(`variants.${index}.sellabilityMode`, "DIRECT");
    } else {
      form.setValue(`variants.${index}.sellabilityMode`, "UNLIMITED");
      form.setValue(`variants.${index}.stockVariantId`, undefined);
      form.setValue(`variants.${index}.directQuantity`, undefined);
    }
  };

  // Default the "Quantity per sale" to 1 the moment a variant lands in
  // DIRECT mode without one. Reading via form.getValues() means the effect
  // doesn't refire when the user later clears or edits the field — they
  // stay in control after the initial seed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (mode !== "DIRECT") return;
    const current = form.getValues(`variants.${index}.directQuantity`);
    if (current == null) {
      form.setValue(`variants.${index}.directQuantity`, 1, {
        shouldValidate: true,
      });
    }
  }, [mode, index, form]);

  // DIRECT mode: derive cost from the linked stock item's weighted-average
  // cost × direct quantity per sale. Mirrors what the backend will charge
  // on average at sale time (BatchConsumptionResult.weightedAverageCost) —
  // the actual cost still comes from the specific FEFO/FIFO batch consumed,
  // which is why this is an "approximate" display value.
  useEffect(() => {
    if (mode !== "DIRECT") return;
    if (!stockVariantId || directQuantity == null || directQuantity <= 0) return;
    const unitCost = stockVariantCosts[stockVariantId];
    if (unitCost == null) return;
    const derivedCost = Number((unitCost * directQuantity).toFixed(4));
    form.setValue(`variants.${index}.costPrice`, derivedCost, {
      shouldValidate: true,
    });
  }, [mode, stockVariantId, directQuantity, stockVariantCosts, index, form]);

  // Markup-based pricing derives the selling price from cost + markup. We
  // recompute on every change so the disabled price field always shows the
  // current derived value, and the form submits a number that matches what
  // the merchant sees.
  useEffect(() => {
    if (!isMarkupMode || costPrice == null) return;
    let derived: number | null = null;
    if (pricingStrategy === "PERCENTAGE_MARKUP" && markupPercentage != null) {
      derived = Number(
        (costPrice + (costPrice * markupPercentage) / 100).toFixed(4),
      );
    } else if (pricingStrategy === "FIXED_MARKUP" && markupAmount != null) {
      derived = Number((costPrice + markupAmount).toFixed(4));
    }
    if (derived != null && derived >= 0) {
      form.setValue(`variants.${index}.price`, derived, {
        shouldValidate: true,
      });
    }
  }, [
    isMarkupMode,
    pricingStrategy,
    costPrice,
    markupPercentage,
    markupAmount,
    index,
    form,
  ]);

  return (
    <div
      className={
        showHeader
          ? "border rounded-lg p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/30"
          : "space-y-4"
      }
    >
      {showHeader && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Variant {index + 1}
          </span>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={disabled}
              className="text-red-600 hover:text-red-700 h-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {showHeader && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={`variants.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Variant name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Small, Large"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`variants.${index}.sku`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Auto-generated if blank"
                    {...field}
                    value={field.value ?? ""}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* Pricing — cost, price, strategy, and markup (when applicable) all on
          one row. The markup column appears only for markup-based strategies,
          bumping the grid from 3 to 4 columns on md+ screens. */}
      <div
        className={`grid grid-cols-1 gap-4 ${
          isMarkupMode ? "md:grid-cols-4" : "md:grid-cols-3"
        }`}
      >
        <FormField
          control={form.control}
          name={`variants.${index}.costPrice`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Cost price
                {!tracksStock && <span className="text-red-500"> *</span>}
              </FormLabel>
              <FormControl>
                <NumericFormat
                  customInput={Input}
                  placeholder={
                    tracksStock ? "Derived from stock items" : "0.00"
                  }
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v.floatValue)}
                  decimalScale={4}
                  allowNegative={false}
                  thousandSeparator=","
                  suffix={currencySuffix}
                  // When tracking, cost is sourced from the linked stock
                  // item's weighted-average cost — not editable on the form.
                  disabled={disabled || tracksStock}
                />
              </FormControl>
              {tracksStock && (
                <p className="text-xs text-muted-foreground">
                  {mode === "DIRECT"
                    ? "Current cost from inventory — changes as batches are added or consumed. At sale time the actual cost comes from the batch consumed, which affects recorded profit."
                    : "Defined by your consumption rule. Cost is computed live at sale time from the batches consumed."}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`variants.${index}.price`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Selling price <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <NumericFormat
                  customInput={Input}
                  placeholder={isMarkupMode ? "Auto from markup" : "0.00"}
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v.floatValue ?? 0)}
                  decimalScale={4}
                  allowNegative={false}
                  thousandSeparator=","
                  suffix={currencySuffix}
                  // Markup strategies derive price from cost + markup, so the
                  // field is read-only — the value is kept in sync by the
                  // useEffect above.
                  disabled={disabled || isMarkupMode}
                />
              </FormControl>
              {isMarkupMode && (
                <p className="text-xs text-muted-foreground">
                  {tracksStock
                    ? "Calculated from cost + markup. Recomputes per batch at sale time — selling price moves with cost (intentional)."
                    : "Calculated from cost + markup."}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`variants.${index}.pricingStrategy`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pricing strategy</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRICING_STRATEGY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {pricingStrategy === "PERCENTAGE_MARKUP" && (
          <FormField
            control={form.control}
            name={`variants.${index}.markupPercentage`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Markup % <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <NumericFormat
                    customInput={Input}
                    placeholder="0"
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v.floatValue)}
                    decimalScale={2}
                    allowNegative={false}
                    suffix="%"
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {pricingStrategy === "FIXED_MARKUP" && (
          <FormField
            control={form.control}
            name={`variants.${index}.markupAmount`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Markup amount <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <NumericFormat
                    customInput={Input}
                    placeholder="0.00"
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v.floatValue)}
                    decimalScale={4}
                    allowNegative={false}
                    thousandSeparator=","
                    suffix={currencySuffix}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Track stock toggle (per variant) — default OFF.
          Hidden in auto-create-stock mode: the parent form's master
          toggle drives a backend-side 1:1 link instead. */}
      {!autoCreateStock && (
        <FormItem className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel className="text-sm">Track stock</FormLabel>
            <p className="text-xs text-muted-foreground">
              Deduct inventory when this variant is sold
            </p>
          </div>
          <Switch
            checked={tracksStock}
            onCheckedChange={handleTrackToggle}
            disabled={disabled}
          />
        </FormItem>
      )}

      {/* Tracking sub-fields — only when toggle is ON and not auto-create */}
      {!autoCreateStock && tracksStock && (
        <div className="space-y-4 rounded-lg border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-4">
          <FormField
            control={form.control}
            name={`variants.${index}.sellabilityMode`}
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm">How is stock deducted?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    disabled={disabled}
                  >
                    <SellabilityCard
                      value="DIRECT"
                      current={field.value}
                      title="Direct stock link"
                      description="Each sale deducts a stock item directly"
                    />
                    <SellabilityCard
                      value="RECIPE"
                      current={field.value}
                      title="Recipe (BOM)"
                      description="Deduct via a recipe defined in Consumption Rules"
                    />
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === "DIRECT" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`variants.${index}.stockVariantId`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Stock item <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                      disabled={disabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a stock item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stockVariants.map((sv) => (
                          <SelectItem key={sv.id} value={sv.id}>
                            {sv.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`variants.${index}.directQuantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Quantity per sale{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <NumericFormat
                        customInput={Input}
                        placeholder="1"
                        value={field.value ?? ""}
                        onValueChange={(v) => field.onChange(v.floatValue)}
                        decimalScale={6}
                        allowNegative={false}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {mode === "RECIPE" && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 flex gap-2.5">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                Recipe-driven: define which stock items get deducted in{" "}
                <strong>Consumption Rules</strong> after saving the product.
              </div>
            </div>
          )}
        </div>
      )}

      {showHeader && (
        <FormField
          control={form.control}
          name={`variants.${index}.active`}
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
              <FormLabel className="!mt-0 cursor-pointer text-sm">
                Active (sellable)
              </FormLabel>
            </FormItem>
          )}
        />
      )}
    </div>
  );
}

function SellabilityCard({
  value,
  current,
  title,
  description,
}: {
  value: string;
  current: string;
  title: string;
  description: string;
}) {
  const selected = current === value;
  return (
    <label
      className={`relative cursor-pointer rounded-lg border p-3 flex flex-col gap-1 transition-colors ${
        selected
          ? "border-primary bg-primary/5"
          : "border-input hover:border-primary/40"
      }`}
    >
      <RadioGroupItem value={value} className="absolute right-3 top-3" />
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Chip-style tags input — type and press Enter to add a chip; backspace
// on an empty input removes the last chip; click × to remove a specific
// tag.
// ─────────────────────────────────────────────────────────────────────

function ChipTagsInput({
  tags,
  onChange,
  disabled,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const t = draft.trim();
    if (!t || tags.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...tags, t]);
    setDraft("");
  };

  const removeTag = (t: string) => onChange(tags.filter((x) => x !== t));

  return (
    <div
      className={styles.tagInput}
      onClick={(e) => {
        // Focus the inner input when the empty area is clicked so the
        // chip area behaves like a single composite input.
        const target = e.target as HTMLElement;
        if (target === e.currentTarget) {
          target.querySelector("input")?.focus();
        }
      }}
    >
      {tags.map((t) => (
        <span key={t} className={styles.tagChip}>
          {t}
          <button
            type="button"
            className={styles.tagChipX}
            aria-label={`Remove tag ${t}`}
            onClick={() => removeTag(t)}
            disabled={disabled}
          >
            <XIcon className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && tags.length) {
            removeTag(tags[tags.length - 1]);
          }
        }}
        placeholder={tags.length ? "" : "Type and press Enter"}
        disabled={disabled}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Live preview card (right column)
// ─────────────────────────────────────────────────────────────────────

interface LivePreviewCardProps {
  name: string;
  categoryNames: string[];
  sellPrice: number;
  currency: string;
  primaryImageUrl?: string;
  checklist: Array<{ label: string; done: boolean }>;
  completion: number;
}

function LivePreviewCard({
  name,
  categoryNames,
  sellPrice,
  currency,
  primaryImageUrl,
  checklist,
  completion,
}: LivePreviewCardProps) {
  const initials = useMemo(() => {
    const trimmed = (name || "Product").trim();
    const parts = trimmed.split(/\s+/).slice(0, 2);
    const out = parts.map((w) => w[0]?.toUpperCase() ?? "").join("");
    return out || "PR";
  }, [name]);

  const categoryLine = categoryNames.length
    ? categoryNames.join(" · ").toUpperCase()
    : "NO CATEGORY";

  return (
    <section className={styles.previewCard}>
      <div className={styles.previewHead}>
        <span className={styles.liveDot} />
        <span>LIVE PREVIEW</span>
      </div>
      <div className={styles.previewBody}>
        <div className={styles.previewThumb}>
          {primaryImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={primaryImageUrl} alt="" />
          ) : (
            initials
          )}
        </div>
        <div className={styles.previewName}>
          {name?.trim() ? name : "Untitled product"}
        </div>
        <div className={styles.previewMeta}>{categoryLine} · SKU AUTO</div>
        <div className={styles.previewPrice}>
          <span className={styles.previewPriceNum}>
            {sellPrice ? sellPrice.toLocaleString() : "0"}
          </span>
          <span className={styles.previewPriceCurr}>{currency}</span>
        </div>

        <div className={styles.checklist}>
          {checklist.map((step, i) => (
            <div
              key={step.label}
              className={`${styles.checklistItem} ${
                step.done ? styles.checklistItemDone : ""
              }`}
            >
              <span className={styles.checklistMark}>
                {step.done ? <CheckCircle2 className="h-2.5 w-2.5" /> : null}
              </span>
              <span>{step.label}</span>
              <span className={styles.checklistNum}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.readiness}>
          <div className={styles.readinessHead}>
            <span className={styles.readinessLabel}>READINESS</span>
            <span
              className={`${styles.readinessPct} ${
                completion === 100 ? styles.readinessPctDone : ""
              }`}
            >
              {completion}%
            </span>
          </div>
          <div className={styles.readinessBar}>
            <div
              className={`${styles.readinessBarFill} ${
                completion === 100 ? styles.readinessBarFillDone : ""
              }`}
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Media card — drag-drop hero zone + 4-thumb gallery rail. Up to 5
// images. Only the primary image's URL is persisted today (synced into
// form.imageUrl by the parent); additional images stay client-only
// until the gallery backend lands.
// ─────────────────────────────────────────────────────────────────────

interface GalleryImage {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}
interface MediaCardProps {
  images: GalleryImage[];
  primaryIdx: number;
  setPrimaryIdx: (i: number) => void;
  handleFiles: (files: FileList | File[] | null | undefined) => void;
  removeImage: (e: React.MouseEvent | undefined, i: number) => void;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
}

function MediaCard({
  images,
  primaryIdx,
  setPrimaryIdx,
  handleFiles,
  removeImage,
  dragOver,
  setDragOver,
  fileInputRef,
}: MediaCardProps) {
  const primary = images[primaryIdx];

  return (
    <section className={`${styles.formCard} ${styles.formCardOptional}`}>
      <header className={styles.formCardHead}>
        <div className={styles.icoBox}>
          <ImageIcon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3>
            Media <span className={styles.optionalTag}>OPTIONAL</span>
          </h3>
          <p className={styles.formCardHeadDesc}>
            First image is the primary thumbnail. Up to 5.
          </p>
        </div>
        <div className={styles.formCardActions}>
          <span className={styles.stepBadge}>{images.length}/5</span>
        </div>
      </header>
      <div className={styles.formBody}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className={styles.mediaZone}>
          {/* Hero / primary slot */}
          <div
            className={`${styles.mediaHero} ${
              dragOver ? styles.mediaHeroDrag : ""
            }`}
            onClick={() => {
              if (!primary) fileInputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            {primary ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={primary.dataUrl} alt="" />
                <div className={styles.mediaHeroTag}>PRIMARY</div>
                <button
                  type="button"
                  className={styles.mediaHeroX}
                  aria-label="Remove primary image"
                  onClick={(e) => removeImage(e, primaryIdx)}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <div className={styles.mediaHeroEmpty}>
                <div className={styles.mediaHeroIco}>
                  <ArrowUpFromLine className="h-5 w-5" />
                </div>
                <div className={styles.mediaHeroCta}>
                  <b>Click to upload</b> or drop
                </div>
                <div className={styles.mediaHeroSpec}>
                  PNG · JPG · WEBP · 5MB
                </div>
              </div>
            )}
          </div>

          {/* Rail of 4 secondary slots */}
          <div className={styles.mediaRailGrid}>
            {[0, 1, 2, 3].map((i) => {
              const img = images[i];
              const isPrimary = img && i === primaryIdx;
              return (
                <div
                  key={i}
                  className={`${styles.mediaSlot} ${
                    img ? styles.mediaSlotHas : ""
                  } ${isPrimary ? styles.mediaSlotPrimary : ""}`}
                  onClick={() =>
                    img ? setPrimaryIdx(i) : fileInputRef.current?.click()
                  }
                  title={img ? "Set as primary" : "Add image"}
                >
                  {img ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.dataUrl} alt="" />
                      <button
                        type="button"
                        className={styles.mediaSlotX}
                        aria-label={`Remove image ${i + 1}`}
                        onClick={(e) => removeImage(e, i)}
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </div>
              );
            })}
          </div>

          {primary && primary.size > 0 && (
            <div className={styles.mediaRailMeta}>
              <div className="fname">{primary.name}</div>
              <div className="fsize">
                {(primary.size / 1024).toFixed(0)} KB ·{" "}
                {primary.type.split("/")[1]?.toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


// ─────────────────────────────────────────────────────────────────────
// Modifier groups (attach/detach from the business library)
// ─────────────────────────────────────────────────────────────────────

function ProductModifierGroupsSection({ productId }: { productId: string }) {
  const { toast } = useToast();
  const [attached, setAttached] = useState<ModifierGroup[]>([]);
  const [library, setLibrary] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const [a, l] = await Promise.all([
      listProductModifierGroups(productId),
      listModifierGroups(),
    ]);
    setAttached(a);
    setLibrary(l);
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const attachedIds = new Set(attached.map((g) => g.id));
  const candidates = library.filter(
    (g) => !attachedIds.has(g.id) && g.archivedAt == null && g.active,
  );

  const attach = async () => {
    if (!selectedGroupId) return;
    setBusy(true);
    try {
      const result = await attachModifierGroup(
        productId,
        selectedGroupId,
        attached.length,
      );
      if (
        result &&
        typeof result === "object" &&
        "responseType" in result &&
        result.responseType === "error"
      ) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      } else {
        toast({ title: "Attached" });
        setSelectedGroupId("");
        setPicker(false);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const detach = async (groupId: string, name: string) => {
    if (!confirm(`Detach modifier group "${name}" from this product?`)) return;
    setBusy(true);
    try {
      await detachModifierGroup(productId, groupId);
      toast({ title: "Detached" });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-gray-400" />
              Modifier groups
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Attach reusable groups from your library. Manage the library at{" "}
              <a
                href="/modifier-groups"
                className="underline hover:text-primary"
                target="_blank"
                rel="noreferrer"
              >
                /modifier-groups
              </a>
              .
            </p>
          </div>
          {!picker && candidates.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPicker(true)}
              disabled={busy || loading}
            >
              <Plus className="w-4 h-4 mr-1" /> Attach group
            </Button>
          )}
        </div>

        {picker && (
          <div className="rounded-md border p-3 flex items-center gap-2 bg-background">
            <Select
              value={selectedGroupId}
              onValueChange={setSelectedGroupId}
              disabled={busy}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Pick a modifier group" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              onClick={attach}
              disabled={busy || !selectedGroupId}
            >
              <Save className="h-3.5 w-3.5 mr-1" /> Attach
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPicker(false);
                setSelectedGroupId("");
              }}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-3">
            Loading…
          </p>
        ) : attached.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">
            {library.length === 0
              ? "No modifier groups yet. Create one in the library first."
              : "No groups attached to this product."}
          </p>
        ) : (
          attached.map((g) => (
            <AttachedGroupRow
              key={g.id}
              title={g.name}
              subtitle={`${
                g.selectionType === "SINGLE" ? "Single" : "Multi"
              } · ${g.minSelections}–${g.maxSelections} · ${
                g.options.length
              } option${g.options.length === 1 ? "" : "s"}${
                !g.active ? " · inactive" : ""
              }`}
              onDetach={() => detach(g.id, g.name)}
              disabled={busy}
              optionsPreview={g.options
                .filter((o) => o.active && o.archivedAt == null)
                .map((o) => o.name)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Addon groups (attach/detach from the business library)
// ─────────────────────────────────────────────────────────────────────

function ProductAddonGroupsSection({ productId }: { productId: string }) {
  const { toast } = useToast();
  const [attached, setAttached] = useState<AddonGroup[]>([]);
  const [library, setLibrary] = useState<AddonGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const [a, l] = await Promise.all([
      listProductAddonGroups(productId),
      listAddonGroups(),
    ]);
    setAttached(a);
    setLibrary(l);
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const attachedIds = new Set(attached.map((g) => g.id));
  const candidates = library.filter(
    (g) => !attachedIds.has(g.id) && g.archivedAt == null && g.active,
  );

  const attach = async () => {
    if (!selectedGroupId) return;
    setBusy(true);
    try {
      const result = await attachAddonGroup(
        productId,
        selectedGroupId,
        attached.length,
      );
      if (
        result &&
        typeof result === "object" &&
        "responseType" in result &&
        result.responseType === "error"
      ) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      } else {
        toast({ title: "Attached" });
        setSelectedGroupId("");
        setPicker(false);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const detach = async (groupId: string, name: string) => {
    if (!confirm(`Detach addon group "${name}" from this product?`)) return;
    setBusy(true);
    try {
      await detachAddonGroup(productId, groupId);
      toast({ title: "Detached" });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-gray-400" />
              Addon groups
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Attach reusable groups from your library. Manage the library at{" "}
              <a
                href="/addon-groups"
                className="underline hover:text-primary"
                target="_blank"
                rel="noreferrer"
              >
                /addon-groups
              </a>
              .
            </p>
          </div>
          {!picker && candidates.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPicker(true)}
              disabled={busy || loading}
            >
              <Plus className="w-4 h-4 mr-1" /> Attach group
            </Button>
          )}
        </div>

        {picker && (
          <div className="rounded-md border p-3 flex items-center gap-2 bg-background">
            <Select
              value={selectedGroupId}
              onValueChange={setSelectedGroupId}
              disabled={busy}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Pick an addon group" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              onClick={attach}
              disabled={busy || !selectedGroupId}
            >
              <Save className="h-3.5 w-3.5 mr-1" /> Attach
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPicker(false);
                setSelectedGroupId("");
              }}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-3">
            Loading…
          </p>
        ) : attached.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">
            {library.length === 0
              ? "No addon groups yet. Create one in the library first."
              : "No groups attached to this product."}
          </p>
        ) : (
          attached.map((g) => (
            <AttachedGroupRow
              key={g.id}
              title={g.name}
              subtitle={`${g.minSelections}–${g.maxSelections} addon${
                g.maxSelections === 1 ? "" : "s"
              } · ${g.items.length} item${g.items.length === 1 ? "" : "s"}${
                !g.active ? " · inactive" : ""
              }`}
              onDetach={() => detach(g.id, g.name)}
              disabled={busy}
              optionsPreview={g.items
                .filter((i) => i.active)
                .map((i) => i.productVariantDisplayName)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

// Picker shown on the create form (no productId yet). Selected IDs ride
// along on the create payload as `modifierGroupIds` / `addonGroupIds` and
// the backend attaches them in the same transaction.
function NewProductLibraryPicker({
  kind,
  value,
  onChange,
}: {
  kind: "modifier" | "addon";
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [library, setLibrary] = useState<
    Array<{ id: string; name: string; archivedAt: string | null; active: boolean }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const groups =
        kind === "modifier"
          ? await listModifierGroups()
          : await listAddonGroups();
      if (cancelled) return;
      setLibrary(
        groups.map((g) => ({
          id: g.id,
          name: g.name,
          archivedAt: g.archivedAt,
          active: g.active,
        })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const byId = new Map(library.map((g) => [g.id, g]));
  const selectedSet = new Set(value);
  const candidates = library.filter(
    (g) => !selectedSet.has(g.id) && g.archivedAt == null && g.active,
  );

  const add = () => {
    if (!selectedId) return;
    onChange([...value, selectedId]);
    setSelectedId("");
    setPicking(false);
  };

  const remove = (id: string) => onChange(value.filter((x) => x !== id));

  const Icon = kind === "modifier" ? Settings2 : TagIcon;
  const libraryHref = kind === "modifier" ? "/modifier-groups" : "/addon-groups";
  const labelPlural = kind === "modifier" ? "modifier groups" : "addon groups";

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Icon className="h-5 w-5 text-gray-400" />
              {kind === "modifier" ? "Modifier groups" : "Addon groups"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Pick groups from your library to attach when this product is
              saved. Manage the library at{" "}
              <a
                href={libraryHref}
                className="underline hover:text-primary"
                target="_blank"
                rel="noreferrer"
              >
                {libraryHref}
              </a>
              .
            </p>
          </div>
          {!picking && candidates.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPicking(true)}
            >
              <Plus className="w-4 h-4 mr-1" /> Attach group
            </Button>
          )}
        </div>

        {picking && (
          <div className="rounded-md border p-3 flex items-center gap-2 bg-background">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="flex-1">
                <SelectValue
                  placeholder={`Pick a ${kind === "modifier" ? "modifier" : "addon"} group`}
                />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" size="sm" onClick={add} disabled={!selectedId}>
              <Save className="h-3.5 w-3.5 mr-1" /> Attach
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPicking(false);
                setSelectedId("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-3">
            Loading…
          </p>
        ) : value.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">
            {library.length === 0
              ? `No ${labelPlural} yet. Create one in the library first.`
              : `No ${labelPlural} selected.`}
          </p>
        ) : (
          value.map((id) => {
            const g = byId.get(id);
            return (
              <div
                key={id}
                className="rounded-lg border p-3 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between gap-2"
              >
                <div className="font-medium text-sm">{g?.name ?? id}</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function AttachedGroupRow({
  title,
  subtitle,
  onDetach,
  disabled,
  optionsPreview,
}: {
  title: string;
  subtitle: string;
  onDetach: () => void;
  disabled: boolean;
  optionsPreview: string[];
}) {
  return (
    <div className="rounded-lg border p-4 bg-gray-50/50 dark:bg-gray-900/30 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
        {optionsPreview.length > 0 && (
          <div className="text-xs text-muted-foreground mt-1 truncate">
            {optionsPreview.slice(0, 6).join(", ")}
            {optionsPreview.length > 6 && ` +${optionsPreview.length - 6} more`}
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDetach}
        disabled={disabled}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1" /> Detach
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Currency price overrides
// ─────────────────────────────────────────────────────────────────────

function PriceOverridesSection({
  productId,
  variants,
}: {
  productId: string;
  variants: ProductVariant[];
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants[0]?.id ?? "",
  );
  const [overrides, setOverrides] = useState<PriceOverrideResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    if (!selectedVariantId) return;
    setLoading(true);
    try {
      const data = await listPriceOverrides(productId, selectedVariantId);
      setOverrides(data);
    } finally {
      setLoading(false);
    }
  }, [productId, selectedVariantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const [draft, setDraft] = useState({ currency: "", price: 0 });
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!draft.currency || !draft.price) return;
    setBusy(true);
    try {
      const result = await upsertPriceOverride(productId, selectedVariantId, {
        currency: draft.currency,
        price: draft.price,
        notes: undefined,
      });
      if (result?.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      } else {
        toast({ title: "Override saved" });
        setDraft({ currency: "", price: 0 });
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (currency: string) => {
    setBusy(true);
    try {
      await removePriceOverride(productId, selectedVariantId, currency);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const variant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId),
    [variants, selectedVariantId],
  );

  return (
    <Card className="rounded-xl shadow-sm mt-6">
      <CardContent className="pt-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Globe className="h-5 w-5 text-gray-400" />
            Currency price overrides
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Set explicit prices for non-native currencies. Without an override,
            orders use FX conversion of the variant&apos;s native price.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Variant</label>
            <Select
              value={selectedVariantId}
              onValueChange={setSelectedVariantId}
              disabled={busy}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {variants.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.displayName || v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {variant && (
            <div className="text-xs text-muted-foreground self-end pb-3">
              Native: {variant.price.toLocaleString()} {variant.nativeCurrency}
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-2">
            {overrides.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-md bg-background border p-2 px-3 text-sm"
              >
                <div>
                  <span className="font-medium">{o.currency}</span>
                  <span className="text-muted-foreground ml-2">
                    {o.price.toLocaleString()}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(o.currency)}
                  disabled={busy}
                  className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {overrides.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No overrides yet.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 items-end">
          <div>
            <label className="text-xs text-muted-foreground">Currency</label>
            <Input
              value={draft.currency}
              onChange={(e) =>
                setDraft({ ...draft, currency: e.target.value.toUpperCase() })
              }
              maxLength={3}
              placeholder="USD"
              disabled={busy}
              className="mt-1 uppercase"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Price</label>
            <NumericFormat
              customInput={Input}
              value={draft.price || ""}
              onValueChange={(v) =>
                setDraft({ ...draft, price: v.floatValue ?? 0 })
              }
              decimalScale={4}
              allowNegative={false}
              thousandSeparator=","
              disabled={busy}
              className="mt-1"
            />
          </div>
          <Button
            type="button"
            onClick={add}
            disabled={busy || draft.currency.length !== 3 || !draft.price}
          >
            <Plus className="w-4 h-4 mr-1" /> Save override
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Inline name form (modifier + addon group "create")
// ─────────────────────────────────────────────────────────────────────

function InlineNameForm({
  placeholder,
  onSubmit,
  onCancel,
  disabled,
}: {
  placeholder: string;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}) {
  const [name, setName] = useState("");

  return (
    <div className="flex items-center gap-2 rounded-md border p-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus
      />
      <Button
        type="button"
        size="sm"
        onClick={() => onSubmit(name.trim())}
        disabled={disabled || !name.trim()}
      >
        <Save className="h-3.5 w-3.5 mr-1" /> Save
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCancel}
        disabled={disabled}
      >
        Cancel
      </Button>
    </div>
  );
}
