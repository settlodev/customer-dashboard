"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
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
  ChevronUp,
  ChevronDown,
  Pencil,
  Search,
  Loader2,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CurrencySelector from "@/components/widgets/currency-selector";
import {
  ControlBox,
  ControlInput,
  ControlTextarea,
  FieldHint,
  FieldLabel,
  controlInputClass,
  controlSelectTriggerClass,
} from "@/components/ui/field";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ConsumptionRuleSelector from "@/components/widgets/consumption-rule-selector";
import RecipeForm from "@/components/forms/recipe-form";
import {
  ModifierGroupForm,
  type StockVariantOption as ModifierStockOption,
} from "@/components/forms/modifier_group_form";
import {
  AddonGroupForm,
  type ProductVariantOption,
} from "@/components/forms/addon_group_form";
import CreateCategoryDialog from "@/components/widgets/create-category-dialog";
import { resolveRuleForProduct } from "@/lib/actions/bom-rule-actions";
import type { BomRule } from "@/types/bom/type";
import type { Category } from "@/types/category/type";

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
  AddonGroupItem,
  PriceOverrideResponse,
} from "@/types/product/type";
import {
  ProductSchema,
  type ProductInput,
  type ProductVariantInput,
} from "@/types/product/schema";
import { PRICING_STRATEGY_OPTIONS } from "@/types/catalogue/enums";

import {
  createProduct,
  createProductWithStock,
  updateProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  fetchAllProducts,
  generateAIDescription,
  listPriceOverrides,
  upsertPriceOverride,
  removePriceOverride,
  saveProductDraft,
  publishProduct,
} from "@/lib/actions/product-actions";
import { uploadService } from "@/lib/uploads/upload-service";
import {
  listModifierGroups,
  listProductModifierGroups,
  attachModifierGroup,
  detachModifierGroup,
  updateAttachedModifierGroup,
} from "@/lib/actions/modifier-actions";
import {
  listAddonGroups,
  listProductAddonGroups,
  attachAddonGroup,
  detachAddonGroup,
  updateAttachedAddonGroup,
} from "@/lib/actions/addon-actions";
import {
  getCachedBrands,
  getCachedCategories,
  getCachedStocks,
  getCachedTaxTypes,
} from "@/lib/cache/reference-data";
import { getBalancesByLocation } from "@/lib/actions/inventory-balance-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import type { TaxType } from "@/types/tax-type/type";
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
  barcode: "",
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
  bomRuleId: undefined,
  autoRetireOnSellout: false,
};

function variantToInput(
  v: ProductVariant,
  productTracksStock: boolean,
): ProductVariantInput {
  // RECIPE and QUANTITY both have unlimited=false, stockLinkType=null —
  // product.trackStock is the discriminator: tracked product → recipe-driven,
  // untracked product → self-managed counter.
  let mode: "UNLIMITED" | "QUANTITY" | "DIRECT" | "RECIPE";
  if (v.unlimited) mode = "UNLIMITED";
  else if (v.stockLinkType === "DIRECT") mode = "DIRECT";
  else if (!productTracksStock) mode = "QUANTITY";
  else mode = "RECIPE";

  return {
    id: v.id,
    name: v.name,
    sku: v.sku ?? "",
    barcode: v.barcode ?? "",
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
    // For RECIPE-mode variants, the active rule is held on a separate
    // BomRuleAttachment table — the form fetches it lazily and primes
    // the field when the variant first renders. Default undefined here.
    bomRuleId: undefined,
    autoRetireOnSellout: v.autoRetireOnSellout ?? false,
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
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [stockVariants, setStockVariants] = useState<StockVariantOption[]>([]);
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
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
  const [autoCreateStock, setAutoCreateStock] = useState<boolean>(() => !item);

  useEffect(() => {
    let cancelled = false;
    // Chain balances off the location promise so it fires in parallel with
    // the other fetches instead of waiting for the entire Promise.all to
    // resolve. On a heavy catalogue, balances are slow and used to block
    // form interactivity behind the much cheaper brands/categories/tax
    // fetches.
    const locationPromise = getCurrentLocation().catch(() => null);
    const balancesPromise = locationPromise.then((loc) =>
      loc?.id ? getBalancesByLocation(loc.id).catch(() => []) : [],
    );
    Promise.all([
      getCachedBrands().catch(() => []),
      getCachedCategories().catch(() => []),
      locationPromise,
      getCachedTaxTypes().catch(() => []),
      balancesPromise,
    ]).then(([b, c, _loc, tx, balances]) => {
      if (cancelled) return;
      setBrands((b ?? []).map((x: any) => ({ id: x.id, name: x.name })));
      setCategories((c ?? []).map((x: any) => ({ id: x.id, name: x.name })));
      setCategoriesLoading(false);
      // Tax types — only the active rows are pickable. Stash sorted by
      // sortOrder/code so the dropdown matches the ordering in the
      // accounting service's own list page.
      const activeTaxTypes = ((tx ?? []) as TaxType[])
        .filter((t) => t.active)
        .sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            a.code.localeCompare(b.code),
        );
      setTaxTypes(activeTaxTypes);

      // Inventory balances carry both the leading-batch cost and the
      // weighted-average. Prefer currentBatchCost — that's what the system
      // would actually charge from the next FEFO/FIFO consumption — and
      // fall back to averageCost only when no batch info is available
      // (e.g. legacy stock without batches).
      const costMap: Record<string, number> = {};
      for (const bal of balances ?? []) {
        if (!bal?.stockVariantId) continue;
        const unitCost = bal.currentBatchCost ?? bal.averageCost;
        if (unitCost != null) {
          costMap[bal.stockVariantId] = unitCost;
        }
      }
      setStockVariantCosts(costMap);
    });
    return () => {
      cancelled = true;
    };
  }, [isEditMode, item]);

  // Stocks load in parallel but out of the critical render path. The
  // catalogue can run thousands of items × variants, and the form's
  // initial render doesn't need them — only the inline variant picker
  // does. Fetching here lets the rest of the form become interactive
  // immediately; the picker shows an empty list until this resolves and
  // then fills in.
  useEffect(() => {
    let cancelled = false;
    getCachedStocks()
      .catch(() => [])
      .then((s) => {
        if (cancelled) return;
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
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const form = useForm<ProductInput>({
    resolver: zodResolver(ProductSchema),
    defaultValues: item
      ? {
          name: item.name,
          nativeCurrency: item.nativeCurrency ?? "TZS",
          description: item.description ?? "",
          imageUrls: item.imageUrls ?? (item.imageUrl ? [item.imageUrl] : []),
          brandId: item.brandId ?? undefined,
          categoryIds: item.categories?.map((c) => c.id) ?? [],
          tags: item.tags ?? [],
          sellOnline: item.sellOnline,
          taxInclusive: item.taxInclusive,
          taxTypeId: item.variants?.find((v) => v.taxTypeId)?.taxTypeId ?? "",
          active: item.active,
          lifecycleStatus: item.lifecycleStatus,
          replacementProductId: item.replacementProductId ?? undefined,
          variants: (item.variants ?? []).map((v) =>
            variantToInput(v, item.trackStock),
          ),
        }
      : {
          name: "",
          nativeCurrency: "TZS",
          description: "",
          imageUrls: [],
          brandId: undefined,
          categoryIds: [],
          tags: [],
          sellOnline: true,
          taxInclusive: true,
          taxTypeId: "",
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
  const defaultTaxTypeId = useMemo(() => {
    if (!taxTypes.length) return undefined;
    const a = taxTypes.find((t) => t.code === "A");
    if (a) return a.id;
    const seeded = taxTypes.find((t) => t.isDefault);
    return seeded?.id ?? taxTypes[0]?.id;
  }, [taxTypes]);

  useEffect(() => {
    if (!defaultTaxTypeId) return;
    if (!form.getValues("taxTypeId")) {
      form.setValue("taxTypeId", defaultTaxTypeId, { shouldDirty: false });
    }
  }, [defaultTaxTypeId, form]);

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.warn("Product form validation errors", errors);
    if (errors.variants) {
      setActiveTab("pricing");
      return;
    }
    const taxFields = [
      "taxTypeId",
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
    // Single-variant products keep the lone variant's name in lockstep with
    // the product name. The variant-name field is hidden when there's only one
    // variant (it defaults to "Default"), so editing the product name would
    // otherwise leave the variant's name stale. Multi-variant products keep
    // their distinct per-variant names untouched.
    const effectiveValues: ProductInput =
      values.variants.length === 1
        ? { ...values, variants: [{ ...values.variants[0], name: values.name }] }
        : values;
    startTransition(async () => {
      try {
        if (!isEditMode) {
          const result = autoCreateStock
            ? await createProductWithStock(effectiveValues, {
                materialType: "FINISHED_GOOD",
              })
            : await createProduct(effectiveValues);
          if (result?.responseType === "error") setResponse(result);
          return;
        }

        const productResult = await updateProduct(item!.id, effectiveValues);
        if (productResult?.responseType === "error") {
          setResponse(productResult);
          return;
        }

        for (const v of effectiveValues.variants) {
          const variantResult = v.id
            ? await updateVariant(item!.id, v.id, v, effectiveValues.taxTypeId)
            : await createVariant(item!.id, v, effectiveValues.taxTypeId);
          if (variantResult?.responseType === "error") {
            setResponse({
              ...variantResult,
              message: v.name
                ? `${v.name}: ${variantResult.message}`
                : variantResult.message,
            });
            return;
          }
        }
        for (const removedId of removedVariantIds) {
          const removeResult = await deleteVariant(item!.id, removedId);
          if (removeResult?.responseType === "error") {
            setResponse(removeResult);
            return;
          }
        }
        setRemovedVariantIds([]);

        toast({ title: "Saved", description: "Product updated successfully." });
        router.push(`/products/${item!.id}`);
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

  // Stable across renders so the memoised VariantEditor doesn't re-render
  // every time the parent ticks (which it does on every keystroke).
  // `variantsArray.remove` is itself stable per RHF, so destructuring lets
  // the lint rule see the dep without dragging the whole array reference.
  const { remove: removeFromVariantsArray } = variantsArray;
  const removeVariant = useCallback(
    (index: number) => {
      const variant = form.getValues(`variants.${index}`);
      if (variant.id) {
        setRemovedVariantIds((prev) => [...prev, variant.id!]);
      }
      removeFromVariantsArray(index);
    },
    [form, removeFromVariantsArray],
  );

  const handleAddVariant = () => {
    const next = variantsArray.fields.length + 1;
    if (variantsArray.fields.length === 1) {
      const current = form.getValues("variants.0");
      if (current?.name === "Default" || !current?.name) {
        form.setValue("variants.0.name", "Variant 1");
      }
    }
    variantsArray.append({
      ...DEFAULT_VARIANT,
      name: `Variant ${next}`,
    });
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

  const [galleryImages, setGalleryImages] = useState<
    Array<{ name: string; size: number; type: string; dataUrl: string }>
  >([]);
  const [primaryIdx, setPrimaryIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const initial: string[] = item?.imageUrls?.length
      ? item.imageUrls
      : item?.imageUrl
        ? [item.imageUrl]
        : [];
    if (!initial.length) return;
    setGalleryImages((prev) => {
      if (prev.length) return prev;
      return initial.map((url: string, i: number) => ({
        name: i === 0 ? "current image" : `current image ${i + 1}`,
        size: 0,
        type: "image/*",
        dataUrl: url,
      }));
    });
  }, [item]);

  const handleFiles = useCallback(
    async (files: FileList | File[] | null | undefined) => {
      if (!files) return;
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!arr.length) return;
      setIsUploadingGallery(true);
      try {
        const uploaded = await Promise.all(
          arr.map(async (file) => {
            const result = await uploadService.upload({
              file,
              purpose: "PRODUCT_IMAGE",
            });
            return {
              name: file.name,
              size: file.size,
              type: file.type,
              dataUrl: result.url,
            };
          }),
        );
        setGalleryImages((prev) => [...prev, ...uploaded].slice(0, 5));
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description:
            error instanceof Error
              ? error.message
              : "Couldn't upload one of the images.",
        });
      } finally {
        setIsUploadingGallery(false);
      }
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

  useEffect(() => {
    // Cover image first, rest in current order. Backend takes the list
    // verbatim — element 0 is what POS / lists thumbnail.
    const cover = galleryImages[primaryIdx];
    const rest = galleryImages.filter((_, idx) => idx !== primaryIdx);
    const ordered = cover ? [cover, ...rest] : rest;
    form.setValue(
      "imageUrls",
      ordered.map((g) => g.dataUrl).filter((u) => !!u),
      { shouldDirty: true },
    );
  }, [galleryImages, primaryIdx, form]);

  // Subscribe to just the first variant rather than the whole `variants`
  // array — the readiness checklist + live preview only look at variant 0,
  // so watching the full array used to re-render this parent (and the
  // expensive LivePreviewCard tree) on every keystroke in any variant row.
  const watchedName = form.watch("name");
  const watchedCategoryIds = form.watch("categoryIds");
  const firstVariant = form.watch("variants.0");
  const stockRuleSatisfied =
    autoCreateStock ||
    firstVariant?.sellabilityMode === "UNLIMITED" ||
    firstVariant?.sellabilityMode === "RECIPE" ||
    (firstVariant?.sellabilityMode === "QUANTITY" &&
      (firstVariant?.availableQuantity ?? -1) >= 0) ||
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
  const categoryDisplayNames = useMemo(() => {
    if (!watchedCategoryIds?.length) return [];
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return watchedCategoryIds
      .map((id) => map.get(id))
      .filter((n): n is string => !!n);
  }, [watchedCategoryIds, categories]);

  const handleSaveAsDraft = useCallback(() => {
    startTransition(async () => {
      const result = await saveProductDraft(form.getValues(), item?.id);
      if (result?.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't save draft",
          description: result.message,
        });
        return;
      }
      toast({ title: "Draft saved" });
      const newId = (result?.data as { id?: string } | undefined)?.id;
      if (!item?.id && newId) {
        router.replace(`/products/${newId}/edit`);
      }
    });
  }, [form, item?.id, router, toast]);

  const handlePublish = useCallback(() => {
    if (!item?.id) return;
    startTransition(async () => {
      const result = await publishProduct(item.id);
      if (result?.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't publish product",
          description: result.message,
        });
        return;
      }
      toast({ title: "Product published" });
      router.push("/products");
    });
  }, [item?.id, router, toast]);

  const isDraftProduct = item?.lifecycleStatus === "DRAFT";

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
                <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 xl:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-[7px] min-w-0 sm:col-span-2">
                        <FieldLabel required>Product name</FieldLabel>
                        <FormControl>
                          <ControlInput
                            prefix={<Package className="h-3.5 w-3.5" />}
                            placeholder="e.g. Cappuccino, Fish & Chips"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nativeCurrency"
                    render={({ field }) => (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel>Currency</FieldLabel>
                        <FormControl>
                          <CurrencySelector
                            value={field.value || "TZS"}
                            onChange={field.onChange}
                            isDisabled={isPending}
                            placeholder="TZS"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel>Brand</FieldLabel>
                        <Select
                          onValueChange={(v) =>
                            field.onChange(v === "__none__" ? undefined : v)
                          }
                          value={field.value ?? "__none__"}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger className={controlSelectTriggerClass}>
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

                {/* Categories + Tags: stacked on small screens,
                    side-by-side from lg up. */}
                <div className="mt-3.5 grid grid-cols-1 gap-x-4 gap-y-3.5 lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="categoryIds"
                    render={({ field }) => {
                      const selectedIds = field.value ?? [];
                      return (
                        <FormItem className="space-y-[7px]">
                          <FieldLabel required>
                            Categories
                            {categoriesLoading && (
                              <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Loading…
                              </span>
                            )}
                          </FieldLabel>
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <FormControl>
                                <MultiSelect
                                  key={selectedIds.join(",")}
                                  options={categories.map((c) => ({
                                    label: c.name,
                                    value: c.id,
                                  }))}
                                  onValueChange={field.onChange}
                                  defaultValue={selectedIds}
                                  placeholder={
                                    categoriesLoading
                                      ? "Loading categories…"
                                      : "Pick at least one category"
                                  }
                                  maxCount={5}
                                  disabled={categoriesLoading}
                                  badgeClassName="m-0.5 rounded border border-line bg-canvas px-2 py-0.5 text-[11.5px] font-mono text-ink-2 hover:bg-canvas"
                                  badgeIconClassName="ml-1 h-3 w-3 rounded-sm text-muted-foreground hover:text-foreground"
                                />
                              </FormControl>
                            </div>
                            <CreateCategoryDialog
                              disabled={categoriesLoading}
                              onCreated={(category: Category) => {
                                setCategories((prev) =>
                                  prev.some((c) => c.id === category.id)
                                    ? prev
                                    : [
                                        ...prev,
                                        {
                                          id: category.id,
                                          name: category.name,
                                        },
                                      ],
                                );
                                field.onChange([...selectedIds, category.id]);
                              }}
                              trigger={
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  disabled={categoriesLoading}
                                  className="shrink-0"
                                  title="Create a new category"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </div>
                          {!field.value?.length && (
                            <FieldHint>
                              Categorisation drives reports, addons, and tax
                              rules.
                            </FieldHint>
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {/* Tags */}
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem className="space-y-[7px]">
                        <FieldLabel>
                          Tags
                          <span className="ml-auto font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                            {(field.value ?? []).length} ADDED
                          </span>
                        </FieldLabel>
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
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="mt-[15px] space-y-[7px]">
                      <FieldLabel>
                        Description
                        <button
                          type="button"
                          className={styles.generateLink}
                          onClick={handleGenerateDescription}
                          disabled={isPending}
                        >
                          <Sparkles className="h-3 w-3" /> GENERATE
                        </button>
                      </FieldLabel>
                      <FormControl>
                        <ControlTextarea
                          placeholder="What is this product?"
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                          maxLength={500}
                        />
                      </FormControl>
                      <FieldHint>
                        <span className={styles.descCount}>
                          {field.value?.length ?? 0}/500
                        </span>
                        {" · Used on e-commerce website and digital menu."}
                      </FieldHint>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                            variant so deductions just work. Switch off to link
                            an existing stock item, use a recipe, or sell
                            without inventory.
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
                            onRemove={removeVariant}
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
                        onRemove={removeVariant}
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
                    <NewProductModifierGroupsPicker
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
                    <NewProductAddonGroupsPicker
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
                    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="taxTypeId"
                        render={({ field }) => (
                          <FormItem className="space-y-[7px]">
                            <FieldLabel required>Tax type</FieldLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                              disabled={isPending || taxTypes.length === 0}
                            >
                              <FormControl>
                                <SelectTrigger className={controlSelectTriggerClass}>
                                  <SelectValue
                                    placeholder={
                                      taxTypes.length === 0
                                        ? "Loading tax types…"
                                        : "Pick a tax type"
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {taxTypes.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.code} — {t.name} ({t.ratePercent}%)
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
                          <FormItem className="space-y-[7px]">
                            <FieldLabel>Tax inclusive</FieldLabel>
                            <div className="flex h-9 w-full items-center gap-2 rounded-md border border-line bg-card px-3 text-xs">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={isPending}
                                />
                              </FormControl>
                              <span className="truncate text-muted-foreground">
                                {field.value
                                  ? "Price includes tax"
                                  : "Tax added at checkout"}
                              </span>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sellOnline"
                        render={({ field }) => (
                          <FormItem className="space-y-[7px]">
                            <FieldLabel>Sell online</FieldLabel>
                            <div className="flex h-9 w-full items-center gap-2 rounded-md border border-line bg-card px-3 text-xs">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={isPending}
                                />
                              </FormControl>
                              <span className="truncate text-muted-foreground">
                                {field.value
                                  ? "Visible in the online catalog"
                                  : "Hidden from the online catalog"}
                              </span>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {isEditMode && (
                      <ProductLifecycleControl
                        form={form}
                        disabled={isPending}
                      />
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
              isUploading={isUploadingGallery}
            />
          </aside>
        </div>

        {/* Sticky footer */}
        <div className={styles.formFoot}>
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
          {isEditMode && isDraftProduct && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePublish}
              disabled={isPending || !isValid}
              title={
                isValid
                  ? "Publish this draft — makes it live in the catalog"
                  : `Complete required fields (${remainingFields} remaining)`
              }
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Publish
            </Button>
          )}
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
  /**
   * Receives the variant index so the parent can keep a single stable
   * remove function and avoid an inline arrow per row — that arrow used
   * to defeat the `React.memo` wrap below and re-render every variant on
   * every keystroke.
   */
  onRemove: (index: number) => void;
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

function VariantEditorImpl({
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
  // One subscription on the variant subtree instead of seven separate
  // watches — RHF's per-watch bookkeeping is cheap individually but adds
  // up across re-renders of a multi-variant form.
  const variant = useWatch({
    control: form.control,
    name: `variants.${index}`,
  });
  const mode = variant?.sellabilityMode;
  const pricingStrategy = variant?.pricingStrategy;
  const costPrice = variant?.costPrice;
  const markupPercentage = variant?.markupPercentage;
  const markupAmount = variant?.markupAmount;
  const stockVariantId = variant?.stockVariantId;
  const directQuantity = variant?.directQuantity;
  const currency = form.watch("nativeCurrency") || "TZS";
  const tracksStock = mode === "DIRECT" || mode === "RECIPE";
  const isMarkupMode =
    pricingStrategy === "PERCENTAGE_MARKUP" ||
    pricingStrategy === "FIXED_MARKUP";

  const handleTrackToggle = (track: boolean) => {
    if (track) {
      form.setValue(`variants.${index}.sellabilityMode`, "DIRECT");
      form.setValue(`variants.${index}.availableQuantity`, undefined);
    } else {
      form.setValue(`variants.${index}.sellabilityMode`, "UNLIMITED");
      form.setValue(`variants.${index}.stockVariantId`, undefined);
      form.setValue(`variants.${index}.directQuantity`, undefined);
    }
  };

  useEffect(() => {
    if (mode !== "DIRECT") return;
    const current = form.getValues(`variants.${index}.directQuantity`);
    if (current == null) {
      form.setValue(`variants.${index}.directQuantity`, 1, {
        shouldValidate: true,
      });
    }
  }, [mode, index, form]);

  useEffect(() => {
    if (mode !== "DIRECT") return;
    if (!stockVariantId || directQuantity == null || directQuantity <= 0)
      return;
    const unitCost = stockVariantCosts[stockVariantId];
    if (unitCost == null) return;
    const derivedCost = Number((unitCost * directQuantity).toFixed(4));
    form.setValue(`variants.${index}.costPrice`, derivedCost, {
      shouldValidate: true,
    });
  }, [mode, stockVariantId, directQuantity, stockVariantCosts, index, form]);

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
        showHeader ? "border rounded-lg p-4 space-y-4 bg-muted/40" : "space-y-4"
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
              onClick={() => onRemove(index)}
              disabled={disabled}
              className="text-red-600 hover:text-red-700 h-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {showHeader && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name={`variants.${index}.name`}
            render={({ field }) => (
              <FormItem className="space-y-[7px]">
                <FieldLabel required>Variant name</FieldLabel>
                <FormControl>
                  <ControlInput
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
              <FormItem className="space-y-[7px]">
                <FieldLabel>SKU</FieldLabel>
                <FormControl>
                  <ControlInput
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

          <FormField
            control={form.control}
            name={`variants.${index}.barcode`}
            render={({ field }) => (
              <FormItem className="space-y-[7px]">
                <FieldLabel>Barcode</FieldLabel>
                <FormControl>
                  <ControlInput
                    placeholder="Optional · scan or enter, or generate later"
                    {...field}
                    value={field.value ?? ""}
                    maxLength={50}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <div
        className={`grid grid-cols-1 gap-4 ${
          isMarkupMode ? "md:grid-cols-4" : "md:grid-cols-3"
        }`}
      >
        <FormField
          control={form.control}
          name={`variants.${index}.costPrice`}
          render={({ field }) => (
            <FormItem className="space-y-[7px]">
              <FieldLabel required={!tracksStock}>Cost price</FieldLabel>
              <FormControl>
                <ControlBox suffix={currency}>
                  <NumericFormat
                    className={cn(controlInputClass, "tabular-nums")}
                    placeholder={
                      tracksStock ? "Derived from stock items" : "0.00"
                    }
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v.floatValue)}
                    decimalScale={4}
                    allowNegative={false}
                    thousandSeparator=","
                    disabled={disabled || tracksStock}
                  />
                </ControlBox>
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
            <FormItem className="space-y-[7px]">
              <FieldLabel required>Selling price</FieldLabel>
              <FormControl>
                <ControlBox suffix={currency}>
                  <NumericFormat
                    className={cn(controlInputClass, "tabular-nums")}
                    placeholder={isMarkupMode ? "Auto from markup" : "0.00"}
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v.floatValue ?? 0)}
                    decimalScale={4}
                    allowNegative={false}
                    thousandSeparator=","
                    disabled={disabled || isMarkupMode}
                  />
                </ControlBox>
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
            <FormItem className="space-y-[7px]">
              <FieldLabel>Pricing strategy</FieldLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className={controlSelectTriggerClass}>
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
              <FormItem className="space-y-[7px]">
                <FieldLabel required>Markup %</FieldLabel>
                <FormControl>
                  <ControlBox suffix="%">
                    <NumericFormat
                      className={cn(controlInputClass, "tabular-nums")}
                      placeholder="0"
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v.floatValue)}
                      decimalScale={2}
                      allowNegative={false}
                      disabled={disabled}
                    />
                  </ControlBox>
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
              <FormItem className="space-y-[7px]">
                <FieldLabel required>Markup amount</FieldLabel>
                <FormControl>
                  <ControlBox suffix={currency}>
                    <NumericFormat
                      className={cn(controlInputClass, "tabular-nums")}
                      placeholder="0.00"
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v.floatValue)}
                      decimalScale={4}
                      allowNegative={false}
                      thousandSeparator=","
                      disabled={disabled}
                    />
                  </ControlBox>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
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

      {!autoCreateStock && !tracksStock && (
        <div className="space-y-4 rounded-lg border p-4">
          <FormField
            control={form.control}
            name={`variants.${index}.sellabilityMode`}
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm">
                  How should this variant be sold?
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(next) => {
                      field.onChange(next);
                      if (next === "UNLIMITED") {
                        form.setValue(
                          `variants.${index}.availableQuantity`,
                          undefined,
                        );
                      } else if (next === "QUANTITY") {
                        const current = form.getValues(
                          `variants.${index}.availableQuantity`,
                        );
                        if (current == null) {
                          form.setValue(
                            `variants.${index}.availableQuantity`,
                            0,
                            { shouldValidate: true },
                          );
                        }
                      }
                    }}
                    value={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    disabled={disabled}
                  >
                    <SellabilityCard
                      value="UNLIMITED"
                      current={field.value}
                      title="Unlimited"
                      description="Always available — no quantity tracking"
                    />
                    <SellabilityCard
                      value="QUANTITY"
                      current={field.value}
                      title="Set quantity"
                      description="Manually enter a count; deducts on each sale"
                    />
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === "QUANTITY" && (
            <FormField
              control={form.control}
              name={`variants.${index}.availableQuantity`}
              render={({ field }) => (
                <FormItem className="space-y-[7px]">
                  <FieldLabel required>Starting quantity</FieldLabel>
                  <FormControl>
                    <ControlBox>
                      <NumericFormat
                        className={cn(controlInputClass, "tabular-nums")}
                        placeholder="0"
                        value={field.value ?? ""}
                        onValueChange={(v) => field.onChange(v.floatValue)}
                        decimalScale={6}
                        allowNegative={false}
                        disabled={disabled}
                      />
                    </ControlBox>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Deducts on every sale; sales fail once it hits zero. Adjust
                    here at any time to refill.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      )}

      {/* Tracking sub-fields — only when toggle is ON and not auto-create */}
      {!autoCreateStock && tracksStock && (
        <div className="space-y-4 rounded-lg border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-4">
          <FormField
            control={form.control}
            name={`variants.${index}.sellabilityMode`}
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm">
                  How is stock deducted?
                </FormLabel>
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
                  <FormItem className="space-y-[7px]">
                    <FieldLabel required>Stock item</FieldLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                      disabled={disabled}
                    >
                      <FormControl>
                        <SelectTrigger className={controlSelectTriggerClass}>
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
                  <FormItem className="space-y-[7px]">
                    <FieldLabel required>Quantity per sale</FieldLabel>
                    <FormControl>
                      <ControlBox>
                        <NumericFormat
                          className={cn(controlInputClass, "tabular-nums")}
                          placeholder="1"
                          value={field.value ?? ""}
                          onValueChange={(v) => field.onChange(v.floatValue)}
                          decimalScale={6}
                          allowNegative={false}
                          disabled={disabled}
                        />
                      </ControlBox>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`variants.${index}.autoRetireOnSellout`}
                render={({ field }) => (
                  <FormItem className="md:col-span-2 flex items-start gap-3 rounded-md border border-dashed border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                    <FormControl>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        disabled={disabled}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="!mt-0 cursor-pointer text-sm">
                        Retire after sell-out
                      </FormLabel>
                      <p className="text-xs text-muted-foreground leading-snug">
                        For unique items you won&apos;t restock. The variant
                        disappears from the POS the moment its stock hits zero;
                        historical sales stay in reports.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          )}

          {mode === "RECIPE" && (
            <RecipeAttachField
              control={form.control}
              variantIndex={index}
              variantId={
                form.watch(`variants.${index}.id`) as string | undefined
              }
              disabled={disabled}
              onPrime={(ruleId) =>
                form.setValue(`variants.${index}.bomRuleId`, ruleId, {
                  shouldDirty: false,
                })
              }
            />
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

// Memoised wrapper — skips re-render when none of the props change. Combined
// with a stable {@link onRemove} from the parent, this turns "every
// keystroke re-renders every variant row" into "only the variant whose
// fields changed re-renders" (via the per-variant `form.watch` subscriptions
// inside).
const VariantEditor = React.memo(VariantEditorImpl);

// Inline RECIPE-mode attachment picker — shown beneath the Direct/Recipe
// radio when Recipe is selected. Lets the operator attach an existing
// consumption rule or author a new one in a side drawer without leaving
// the product form. The product action fans out attachBomRule() calls
// per variant after save, so a freshly-created (still-orphan) rule gets
// bound to the variant the moment the product is persisted.
function RecipeAttachField({
  control,
  variantIndex,
  variantId,
  disabled,
  onPrime,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  variantIndex: number;
  variantId?: string;
  disabled?: boolean;
  onPrime: (ruleId: string | undefined) => void;
}) {
  const primedRef = useRef(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectorRefreshKey, setSelectorRefreshKey] = useState(0);

  useEffect(() => {
    if (primedRef.current) return;
    if (!variantId) return;
    primedRef.current = true;
    resolveRuleForProduct(variantId)
      .then((rule) => onPrime(rule?.id ?? undefined))
      .catch(() => onPrime(undefined));
  }, [variantId, onPrime]);

  const handleRuleCreated = (rule: BomRule) => {
    onPrime(rule.id);
    setSelectorRefreshKey((k) => k + 1);
    setDrawerOpen(false);
  };

  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-2.5">
      <div className="flex items-start gap-2.5">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Recipe-driven: stock is deducted via a consumption rule at sale time.
          Pick an existing rule or create a new one.
        </p>
      </div>
      <div className="flex items-end gap-2">
        <FormField
          control={control}
          name={`variants.${variantIndex}.bomRuleId`}
          render={({ field }) => (
            <FormItem className="flex-1 space-y-[7px]">
              <FieldLabel>Consumption rule</FieldLabel>
              <FormControl>
                <ConsumptionRuleSelector
                  key={selectorRefreshKey}
                  value={field.value as string | undefined}
                  onChange={(v) => field.onChange(v || undefined)}
                  isDisabled={disabled}
                  placeholder="Pick a rule to attach"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={disabled}
            >
              <Plus className="mr-1 h-4 w-4" />
              New rule
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl"
            overlayClassName="bg-foreground/30 backdrop-blur-sm"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <SheetHeader className="space-y-1">
                <SheetTitle className="text-base">
                  New consumption rule
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Author the rule here — it&apos;ll attach to this variant when
                  you save the product.
                </SheetDescription>
              </SheetHeader>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <RecipeForm hideAttachments onCreated={handleRuleCreated} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Attaching here applies after the product is saved.
      </p>
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
  isUploading?: boolean;
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
  isUploading = false,
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
          <span className={styles.stepBadge}>
            {isUploading ? "Uploading…" : `${images.length}/5`}
          </span>
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

  const attach = async (groupId: string) => {
    setBusy(true);
    try {
      const result = await attachModifierGroup(
        productId,
        groupId,
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
        setPicker(false);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const detach = async (groupId: string) => {
    setBusy(true);
    try {
      await detachModifierGroup(productId, groupId);
      toast({ title: "Detached" });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  // Reorder via the attachment endpoint. We ship a fresh sortOrder for
  // every row so the backend's view of the list always matches what the
  // merchant sees on screen — no relying on natural insertion order.
  const move = async (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= attached.length) return;
    const reordered = [...attached];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(next, 0, moved);
    setAttached(reordered);
    setBusy(true);
    try {
      await Promise.all(
        reordered.map((g, i) =>
          updateAttachedModifierGroup(productId, g.id, i),
        ),
      );
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Reorder failed",
        description: e?.message ?? "Could not save the new order",
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.formCard}>
      <header className={styles.formCardHead}>
        <div className={styles.icoBox}>
          <Settings2 className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3>Modifier groups</h3>
          <p className={styles.formCardHeadDesc}>
            Reusable customer-facing tweaks (milk type, spice level, extras).
          </p>
        </div>
        <div className={styles.formCardActions}>
          <CreateLibraryGroupButton
            kind="modifier"
            disabled={busy}
            onCreated={async (group) => {
              // Edit-mode: attach the new group to this product right
              // away — the merchant's intent is "add a fresh group AND
              // wire it up", and refreshing brings it into the attached
              // list with the right sort order.
              await attach(group.id);
            }}
          />
          {!picker && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPicker(true)}
              disabled={busy || loading || candidates.length === 0}
              title={
                candidates.length === 0 && library.length > 0
                  ? "Every active group is already attached"
                  : undefined
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Attach group
            </Button>
          )}
        </div>
      </header>

      <div className={styles.formBody}>
        {picker && (
          <ModifierGroupPicker
            candidates={candidates}
            disabled={busy}
            onPick={attach}
            onCancel={() => setPicker(false)}
          />
        )}

        {loading ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Loading…
          </p>
        ) : attached.length === 0 ? (
          <ModifierGroupsEmpty
            hasLibrary={library.length > 0}
            mode="attached"
          />
        ) : (
          <div className="space-y-2.5">
            {attached.map((g, idx) => (
              <AttachedModifierGroupRow
                key={g.id}
                group={g}
                position={idx}
                total={attached.length}
                disabled={busy}
                onMoveUp={() => move(idx, -1)}
                onMoveDown={() => move(idx, 1)}
                onDetach={() => detach(g.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Picker — searchable list of library candidates rendered as cards.
// Shows the same metadata the attached row shows, so the merchant
// commits with full context.
// ─────────────────────────────────────────────────────────────────────
function ModifierGroupPicker({
  candidates,
  disabled,
  onPick,
  onCancel,
}: {
  candidates: ModifierGroup[];
  disabled: boolean;
  onPick: (groupId: string) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.options.some((o) => o.name.toLowerCase().includes(q)),
    );
  }, [candidates, query]);

  return (
    <div className="mb-3 rounded-md border border-line bg-card">
      <div className="flex items-center gap-2 border-b border-line p-2.5">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by group name or option…"
          className="h-7 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={disabled}
          className="h-7"
        >
          Cancel
        </Button>
      </div>
      <div className="max-h-72 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {candidates.length === 0
              ? "Every active group is already attached."
              : `No groups match "${query}".`}
          </p>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onPick(g.id)}
                disabled={disabled}
                className="flex w-full items-start justify-between gap-3 rounded-md border border-line bg-background p-2.5 text-left transition-colors hover:border-foreground/30 hover:bg-card disabled:opacity-60"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{g.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {modifierMetaLine(g)}
                  </div>
                  {g.options.length > 0 && (
                    <OptionChips options={g.options} max={5} />
                  )}
                </div>
                <span className="mt-0.5 shrink-0 text-xs font-medium text-primary">
                  Attach
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Attached row — compact card with reorder, edit-in-library, and detach.
// ─────────────────────────────────────────────────────────────────────
function AttachedModifierGroupRow({
  group,
  position,
  total,
  disabled,
  onMoveUp,
  onMoveDown,
  onDetach,
}: {
  group: ModifierGroup;
  position: number;
  total: number;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDetach: () => void;
}) {
  const isRequired =
    group.selectionType === "SINGLE" && group.minSelections >= 1;
  return (
    <div className="rounded-md border border-line bg-card">
      <div className="flex items-start justify-between gap-3 px-3 pt-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
              {position + 1}/{total}
            </span>
            <span className="truncate text-sm font-medium">{group.name}</span>
            {isRequired && (
              <Badge
                variant="soft"
                className="px-1.5 py-0 text-[10px] uppercase"
              >
                Required
              </Badge>
            )}
            {!group.active && (
              <Badge
                variant="soft"
                className="px-1.5 py-0 text-[10px] uppercase"
              >
                Inactive
              </Badge>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {modifierMetaLine(group)}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={disabled || position === 0}
            className="h-7 w-7 p-0"
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={disabled || position === total - 1}
            className="h-7 w-7 p-0"
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <a
            href={`/modifier-groups/${group.id}/edit`}
            target="_blank"
            rel="noreferrer"
            title="Edit in library"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </a>
          <DetachConfirmDialog
            kind="modifier"
            groupName={group.name}
            disabled={disabled}
            onConfirm={onDetach}
          />
        </div>
      </div>

      {group.options.length > 0 ? (
        <div className="px-3 pb-2.5 pt-1.5">
          <OptionChips options={group.options} max={6} />
        </div>
      ) : (
        <p className="px-3 pb-2.5 pt-1 text-[11px] italic text-muted-foreground">
          No options yet — add some in the library.
        </p>
      )}
    </div>
  );
}

// Compact metadata line shared by the picker and the attached row.
// Includes selection mode, bounds, option count, default name, and a
// tracking-mode breakdown so the merchant sees recipe-driven groups at
// a glance.
function modifierMetaLine(g: ModifierGroup): string {
  const mode =
    g.selectionType === "SINGLE"
      ? g.minSelections >= 1
        ? "Single · required"
        : "Single · optional"
      : `Multi · ${g.minSelections}–${g.maxSelections}`;
  const total = g.options.length;
  const liveOptions = g.options.filter((o) => o.active && o.archivedAt == null);
  const tracked = liveOptions.filter((o) => o.stockVariantId != null).length;
  const defaultOpt = liveOptions.find((o) => o.isDefault);
  const parts = [
    mode,
    `${total} option${total === 1 ? "" : "s"}`,
    tracked > 0 ? `${tracked} tracked` : null,
    defaultOpt ? `default: ${defaultOpt.name}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

// ─────────────────────────────────────────────────────────────────────
// Create-mode picker — collects modifier-group IDs to attach in the
// same transaction as product creation. Same look/feel as the edit-mode
// section so the UX doesn't shift between create and edit.
// ─────────────────────────────────────────────────────────────────────
function NewProductModifierGroupsPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [library, setLibrary] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const groups = await listModifierGroups();
      if (cancelled) return;
      setLibrary(groups);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byId = useMemo(() => new Map(library.map((g) => [g.id, g])), [library]);
  const selectedSet = new Set(value);
  const candidates = library.filter(
    (g) => !selectedSet.has(g.id) && g.archivedAt == null && g.active,
  );

  const attach = (groupId: string) => {
    onChange([...value, groupId]);
    setPicker(false);
  };
  const detach = (groupId: string) =>
    onChange(value.filter((x) => x !== groupId));
  const move = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= value.length) return;
    const reordered = [...value];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(next, 0, moved);
    onChange(reordered);
  };

  return (
    <section className={styles.formCard}>
      <header className={styles.formCardHead}>
        <div className={styles.icoBox}>
          <Settings2 className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3>Modifier groups</h3>
          <p className={styles.formCardHeadDesc}>
            Pick groups to attach when this product is saved.
          </p>
        </div>
        <div className={styles.formCardActions}>
          <CreateLibraryGroupButton
            kind="modifier"
            disabled={false}
            onCreated={(group) => {
              // Create-mode: stash in the local library so the picker
              // can render its meta, and immediately push the id into
              // the form's modifierGroupIds so it's pre-selected for
              // attachment when the product saves.
              setLibrary((prev) => [group as ModifierGroup, ...prev]);
              onChange([...value, group.id]);
            }}
          />
          {!picker && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPicker(true)}
              disabled={loading || candidates.length === 0}
              title={
                candidates.length === 0 && library.length > 0
                  ? "Every active group is already selected"
                  : undefined
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Attach group
            </Button>
          )}
        </div>
      </header>

      <div className={styles.formBody}>
        {picker && (
          <ModifierGroupPicker
            candidates={candidates}
            disabled={false}
            onPick={attach}
            onCancel={() => setPicker(false)}
          />
        )}

        {loading ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Loading…
          </p>
        ) : value.length === 0 ? (
          <ModifierGroupsEmpty
            hasLibrary={library.length > 0}
            mode="selected"
          />
        ) : (
          <div className="space-y-2.5">
            {value.map((id, idx) => {
              const g = byId.get(id);
              if (!g) {
                return (
                  <div
                    key={id}
                    className="rounded-md border border-dashed border-line bg-card px-3 py-2 text-xs text-muted-foreground"
                  >
                    Selected group <code>{id.slice(0, 8)}</code> not found in
                    library — it may have been archived.
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => detach(id)}
                      className="ml-2 h-6 px-2 text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                );
              }
              return (
                <AttachedModifierGroupRow
                  key={id}
                  group={g}
                  position={idx}
                  total={value.length}
                  disabled={false}
                  onMoveUp={() => move(idx, -1)}
                  onMoveDown={() => move(idx, 1)}
                  onDetach={() => detach(id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// Confirmation for detaching a modifier or addon group from the product.
// Renders the same trash icon button the section used to use, but wraps
// it in an AlertDialog instead of calling the bare browser confirm()
// — both for visual consistency with the rest of the form and because
// the native dialog can't be styled to match the dashboard.
function DetachConfirmDialog({
  kind,
  groupName,
  disabled,
  onConfirm,
}: {
  kind: "modifier" | "addon";
  groupName: string;
  disabled: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const noun = kind === "modifier" ? "modifier" : "addon";

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
          title="Detach"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent tone="danger">
        <AlertDialogIcon>
          <Trash2 className="h-5 w-5" />
        </AlertDialogIcon>
        <AlertDialogHeader>
          <AlertDialogTitle>Detach {noun} group?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{groupName}</span>{" "}
            will no longer be attached to this product. The group itself stays
            in your library and can be re-attached anytime.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              await onConfirm();
              setOpen(false);
            }}
          >
            Detach
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Inline drawer for adding a new library group from inside the product
// form — replaces the older "save draft and navigate away" flow. The
// modifier or addon form is rendered inside a side Sheet; on success the
// `onCreated` callback wires the new group into whatever picker hosted
// the trigger. Lazy-loads the catalogue (stocks for modifier, products
// for addon) only when the sheet is first opened.
function CreateLibraryGroupButton({
  kind,
  onCreated,
  disabled,
}: {
  kind: "modifier" | "addon";
  onCreated: (group: ModifierGroup | AddonGroup) => void | Promise<void>;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [stockVariants, setStockVariants] = useState<ModifierStockOption[]>([]);
  const [productVariants, setProductVariants] = useState<
    ProductVariantOption[]
  >([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    (async () => {
      if (kind === "modifier") {
        const stocks = await getCachedStocks().catch(() => [] as any[]);
        if (cancelled) return;
        const opts: ModifierStockOption[] = [];
        for (const s of stocks ?? []) {
          for (const v of s.variants ?? []) {
            if (v.archived) continue;
            opts.push({ id: v.id, label: `${s.name} — ${v.name}` });
          }
        }
        setStockVariants(opts);
      } else {
        const products = await fetchAllProducts().catch(() => [] as any[]);
        if (cancelled) return;
        const opts: ProductVariantOption[] = [];
        for (const p of products ?? []) {
          for (const v of p.variants ?? []) {
            if (v.archivedAt) continue;
            opts.push({
              id: v.id,
              label: `${p.name} — ${v.name}`,
              price: v.price ?? null,
              costPrice: v.costPrice ?? null,
            });
          }
        }
        setProductVariants(opts);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loaded, kind]);

  const noun = kind === "modifier" ? "modifier" : "addon";

  const handleCreated = async (group: ModifierGroup | AddonGroup) => {
    await onCreated(group);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          title={`Create a new ${noun} group`}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> New group
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl"
        overlayClassName="bg-foreground/30 backdrop-blur-sm"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-base">New {noun} group</SheetTitle>
            <SheetDescription className="text-xs">
              {kind === "modifier"
                ? "Build a reusable group of customer-facing tweaks. It'll be added to this product when you save."
                : "Build a reusable group of optional add-ons. It'll be added to this product when you save."}
            </SheetDescription>
          </SheetHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {kind === "modifier" ? (
            <ModifierGroupForm
              group={null}
              stockVariants={stockVariants}
              onCreated={handleCreated}
            />
          ) : (
            <AddonGroupForm
              group={null}
              productVariants={productVariants}
              onCreated={handleCreated}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Compact in-tab empty state — `formBodyEmpty` is sized for full pages
// and felt heavy here. Tight stack, single line of guidance, matches
// the row visuals around it.
function ModifierGroupsEmpty({
  hasLibrary,
  mode,
}: {
  hasLibrary: boolean;
  mode: "attached" | "selected";
}) {
  const title = !hasLibrary
    ? "No modifier groups in your library"
    : mode === "attached"
      ? "Nothing attached"
      : "Nothing selected";
  const detail = !hasLibrary
    ? "Create one in the library to attach it here."
    : "Use Attach group to pick from your library.";
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-line bg-card/50 px-3 py-2.5">
      <Settings2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs font-medium">{title}</p>
        <p className="text-[11px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function OptionChips({
  options,
  max,
}: {
  options: ModifierGroup["options"];
  max: number;
}) {
  const live = options.filter((o) => o.active && o.archivedAt == null);
  const shown = live.slice(0, max);
  const rest = live.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((o) => (
        <span
          key={o.id}
          className={`inline-flex items-center gap-1 rounded-full border border-line bg-background px-1.5 py-0.5 text-[11px] ${
            o.isDefault
              ? "border-primary/40 text-primary"
              : "text-muted-foreground"
          }`}
        >
          {o.name}
          {o.isDefault && <span aria-hidden="true">★</span>}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-[11px] text-muted-foreground">+{rest} more</span>
      )}
    </div>
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

  const attach = async (groupId: string) => {
    setBusy(true);
    try {
      const result = await attachAddonGroup(
        productId,
        groupId,
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
        setPicker(false);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const detach = async (groupId: string) => {
    setBusy(true);
    try {
      await detachAddonGroup(productId, groupId);
      toast({ title: "Detached" });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  // Reorder via the attachment endpoint. Optimistic local reorder; ship
  // a fresh sortOrder for every row so the backend's view always matches
  // what the merchant sees, and refresh from the server on failure.
  const move = async (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= attached.length) return;
    const reordered = [...attached];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(next, 0, moved);
    setAttached(reordered);
    setBusy(true);
    try {
      await Promise.all(
        reordered.map((g, i) => updateAttachedAddonGroup(productId, g.id, i)),
      );
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Reorder failed",
        description: e?.message ?? "Could not save the new order",
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.formCard}>
      <header className={styles.formCardHead}>
        <div className={styles.icoBox}>
          <TagIcon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3>Addon groups</h3>
          <p className={styles.formCardHeadDesc}>
            Companion items the customer can tack on (sides, drinks, extras).
          </p>
        </div>
        <div className={styles.formCardActions}>
          <CreateLibraryGroupButton
            kind="addon"
            disabled={busy}
            onCreated={async (group) => {
              // Edit-mode: attach the new group to this product right
              // away — the merchant's intent is "add a fresh group AND
              // wire it up", and refreshing brings it into the attached
              // list with the right sort order.
              await attach(group.id);
            }}
          />
          {!picker && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPicker(true)}
              disabled={busy || loading || candidates.length === 0}
              title={
                candidates.length === 0 && library.length > 0
                  ? "Every active group is already attached"
                  : undefined
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Attach group
            </Button>
          )}
        </div>
      </header>

      <div className={styles.formBody}>
        {picker && (
          <AddonGroupPicker
            candidates={candidates}
            disabled={busy}
            onPick={attach}
            onCancel={() => setPicker(false)}
          />
        )}

        {loading ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Loading…
          </p>
        ) : attached.length === 0 ? (
          <AddonGroupsEmpty hasLibrary={library.length > 0} mode="attached" />
        ) : (
          <div className="space-y-2.5">
            {attached.map((g, idx) => (
              <AttachedAddonGroupRow
                key={g.id}
                group={g}
                position={idx}
                total={attached.length}
                disabled={busy}
                onMoveUp={() => move(idx, -1)}
                onMoveDown={() => move(idx, 1)}
                onDetach={() => detach(g.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Addon picker — searchable list of library candidates, parity with
// the modifier picker.
// ─────────────────────────────────────────────────────────────────────
function AddonGroupPicker({
  candidates,
  disabled,
  onPick,
  onCancel,
}: {
  candidates: AddonGroup[];
  disabled: boolean;
  onPick: (groupId: string) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.items.some((i) =>
          i.productVariantDisplayName.toLowerCase().includes(q),
        ),
    );
  }, [candidates, query]);

  return (
    <div className="mb-3 rounded-md border border-line bg-card">
      <div className="flex items-center gap-2 border-b border-line p-2.5">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by group name or item…"
          className="h-7 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={disabled}
          className="h-7"
        >
          Cancel
        </Button>
      </div>
      <div className="max-h-72 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {candidates.length === 0
              ? "Every active group is already attached."
              : `No groups match "${query}".`}
          </p>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onPick(g.id)}
                disabled={disabled}
                className="flex w-full items-start justify-between gap-3 rounded-md border border-line bg-background p-2.5 text-left transition-colors hover:border-foreground/30 hover:bg-card disabled:opacity-60"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{g.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {addonMetaLine(g)}
                  </div>
                  {g.items.length > 0 && (
                    <AddonItemChips items={g.items} max={5} />
                  )}
                </div>
                <span className="mt-0.5 shrink-0 text-xs font-medium text-primary">
                  Attach
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Attached addon row — mirrors the modifier row layout (position pill,
// reorder, edit-in-library, detach).
// ─────────────────────────────────────────────────────────────────────
function AttachedAddonGroupRow({
  group,
  position,
  total,
  disabled,
  onMoveUp,
  onMoveDown,
  onDetach,
}: {
  group: AddonGroup;
  position: number;
  total: number;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDetach: () => void;
}) {
  const isRequired = group.minSelections >= 1;
  return (
    <div className="rounded-md border border-line bg-card">
      <div className="flex items-start justify-between gap-3 px-3 pt-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
              {position + 1}/{total}
            </span>
            <span className="truncate text-sm font-medium">{group.name}</span>
            {isRequired && (
              <Badge
                variant="soft"
                className="px-1.5 py-0 text-[10px] uppercase"
              >
                Required
              </Badge>
            )}
            {!group.active && (
              <Badge
                variant="soft"
                className="px-1.5 py-0 text-[10px] uppercase"
              >
                Inactive
              </Badge>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {addonMetaLine(group)}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={disabled || position === 0}
            className="h-7 w-7 p-0"
            title="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={disabled || position === total - 1}
            className="h-7 w-7 p-0"
            title="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <a
            href={`/addon-groups/${group.id}/edit`}
            target="_blank"
            rel="noreferrer"
            title="Edit in library"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </a>
          <DetachConfirmDialog
            kind="addon"
            groupName={group.name}
            disabled={disabled}
            onConfirm={onDetach}
          />
        </div>
      </div>

      {group.items.length > 0 ? (
        <div className="px-3 pb-2.5 pt-1.5">
          <AddonItemChips items={group.items} max={6} />
        </div>
      ) : (
        <p className="px-3 pb-2.5 pt-1 text-[11px] italic text-muted-foreground">
          No items yet — add some in the library.
        </p>
      )}
    </div>
  );
}

// Compact metadata for an addon group: range, item count, override count.
function addonMetaLine(g: AddonGroup): string {
  const range =
    g.minSelections === g.maxSelections
      ? `${g.minSelections}`
      : `${g.minSelections}–${g.maxSelections}`;
  const total = g.items.length;
  const live = g.items.filter((i) => i.active);
  const overridden = live.filter((i) => i.priceOverride != null).length;
  const parts = [
    `Pick ${range}`,
    `${total} item${total === 1 ? "" : "s"}`,
    overridden > 0 ? `${overridden} custom-priced` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

function AddonItemChips({
  items,
  max,
}: {
  items: AddonGroupItem[];
  max: number;
}) {
  const live = items.filter((i) => i.active);
  const shown = live.slice(0, max);
  const rest = live.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((i) => (
        <span
          key={i.id}
          className={`inline-flex items-center gap-1 rounded-full border border-line bg-background px-1.5 py-0.5 text-[11px] ${
            i.priceOverride != null
              ? "border-primary/40 text-primary"
              : "text-muted-foreground"
          }`}
          title={
            i.priceOverride != null
              ? `Custom price: ${i.priceOverride}`
              : undefined
          }
        >
          {i.productVariantDisplayName}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-[11px] text-muted-foreground">+{rest} more</span>
      )}
    </div>
  );
}

function AddonGroupsEmpty({
  hasLibrary,
  mode,
}: {
  hasLibrary: boolean;
  mode: "attached" | "selected";
}) {
  const title = !hasLibrary
    ? "No addon groups in your library"
    : mode === "attached"
      ? "Nothing attached"
      : "Nothing selected";
  const detail = !hasLibrary
    ? "Create one in the library to attach it here."
    : "Use Attach group to pick from your library.";
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-line bg-card/50 px-3 py-2.5">
      <TagIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs font-medium">{title}</p>
        <p className="text-[11px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Create-mode addon picker — collects addon-group IDs to attach in the
// same transaction as product creation. Same look/feel as edit mode.
// ─────────────────────────────────────────────────────────────────────
function NewProductAddonGroupsPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [library, setLibrary] = useState<AddonGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const groups = await listAddonGroups();
      if (cancelled) return;
      setLibrary(groups);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byId = useMemo(() => new Map(library.map((g) => [g.id, g])), [library]);
  const selectedSet = new Set(value);
  const candidates = library.filter(
    (g) => !selectedSet.has(g.id) && g.archivedAt == null && g.active,
  );

  const attach = (groupId: string) => {
    onChange([...value, groupId]);
    setPicker(false);
  };
  const detach = (groupId: string) =>
    onChange(value.filter((x) => x !== groupId));
  const move = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= value.length) return;
    const reordered = [...value];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(next, 0, moved);
    onChange(reordered);
  };

  return (
    <section className={styles.formCard}>
      <header className={styles.formCardHead}>
        <div className={styles.icoBox}>
          <TagIcon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3>Addon groups</h3>
          <p className={styles.formCardHeadDesc}>
            Pick groups to attach when this product is saved.
          </p>
        </div>
        <div className={styles.formCardActions}>
          <CreateLibraryGroupButton
            kind="addon"
            disabled={false}
            onCreated={(group) => {
              // Create-mode: stash the new group in the local library so
              // the picker can render its meta, and pre-select it via
              // addonGroupIds so it's attached when the product saves.
              setLibrary((prev) => [group as AddonGroup, ...prev]);
              onChange([...value, group.id]);
            }}
          />
          {!picker && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPicker(true)}
              disabled={loading || candidates.length === 0}
              title={
                candidates.length === 0 && library.length > 0
                  ? "Every active group is already selected"
                  : undefined
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Attach group
            </Button>
          )}
        </div>
      </header>

      <div className={styles.formBody}>
        {picker && (
          <AddonGroupPicker
            candidates={candidates}
            disabled={false}
            onPick={attach}
            onCancel={() => setPicker(false)}
          />
        )}

        {loading ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Loading…
          </p>
        ) : value.length === 0 ? (
          <AddonGroupsEmpty hasLibrary={library.length > 0} mode="selected" />
        ) : (
          <div className="space-y-2.5">
            {value.map((id, idx) => {
              const g = byId.get(id);
              if (!g) {
                return (
                  <div
                    key={id}
                    className="rounded-md border border-dashed border-line bg-card px-3 py-2 text-xs text-muted-foreground"
                  >
                    Selected group <code>{id.slice(0, 8)}</code> not found in
                    library — it may have been archived.
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => detach(id)}
                      className="ml-2 h-6 px-2 text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                );
              }
              return (
                <AttachedAddonGroupRow
                  key={id}
                  group={g}
                  position={idx}
                  total={value.length}
                  disabled={false}
                  onMoveUp={() => move(idx, -1)}
                  onMoveDown={() => move(idx, 1)}
                  onDetach={() => detach(id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Lifecycle / visibility — single Status control that drives the two
// underlying form fields (`lifecycleStatus` + `active`). Replaces the
// older "Status dropdown + Active switch" pair which forced merchants
// to reason about an invalid combination matrix.
// ─────────────────────────────────────────────────────────────────────

type LifecycleStatusKey =
  | "DRAFT"
  | "ACTIVE"
  | "HIDDEN"
  | "DISCONTINUED"
  | "END_OF_LIFE";

const LIFECYCLE_STATUS_KEYS: {
  key: Exclude<LifecycleStatusKey, "DRAFT">;
  label: string;
  hint: string;
  lifecycleStatus: "ACTIVE" | "DISCONTINUED" | "END_OF_LIFE";
  active: boolean;
}[] = [
  {
    key: "ACTIVE",
    label: "Active",
    hint: "Live in the POS and online catalog.",
    lifecycleStatus: "ACTIVE",
    active: true,
  },
  {
    key: "HIDDEN",
    label: "Hidden",
    hint: "Temporarily hidden from POS — out of season, low stock, etc.",
    lifecycleStatus: "ACTIVE",
    active: false,
  },
  {
    key: "DISCONTINUED",
    label: "Discontinued",
    hint: "No longer being sold. Kept for reports; consider setting a replacement.",
    lifecycleStatus: "DISCONTINUED",
    active: false,
  },
  {
    key: "END_OF_LIFE",
    label: "End of life",
    hint: "Fully retired. Hidden everywhere; preserved for historical orders.",
    lifecycleStatus: "END_OF_LIFE",
    active: false,
  },
];

function ProductLifecycleControl({
  form,
  disabled,
}: {
  form: ReturnType<typeof useForm<ProductInput>>;
  disabled: boolean;
}) {
  const lifecycleStatus = form.watch("lifecycleStatus");
  const active = form.watch("active");
  const isDraft = lifecycleStatus === "DRAFT";

  const currentKey: LifecycleStatusKey = isDraft
    ? "DRAFT"
    : lifecycleStatus === "DISCONTINUED"
      ? "DISCONTINUED"
      : lifecycleStatus === "END_OF_LIFE"
        ? "END_OF_LIFE"
        : active
          ? "ACTIVE"
          : "HIDDEN";

  const handleChange = (next: string) => {
    const entry = LIFECYCLE_STATUS_KEYS.find((s) => s.key === next);
    if (!entry) return;
    form.setValue("lifecycleStatus", entry.lifecycleStatus, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("active", entry.active, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const currentHint =
    LIFECYCLE_STATUS_KEYS.find((s) => s.key === currentKey)?.hint ?? null;

  return (
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
            One control for visibility and retirement — replaces the old status
            / active pair.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-[18px] gap-y-[15px]">
        <FormItem className="space-y-[7px]">
          <FieldLabel>Status</FieldLabel>
          {isDraft ? (
            // Draft is a flow-only state — the merchant moves out of it via
            // the Save-as-draft / Publish footer buttons. Show it read-only
            // here so the dropdown can't accidentally side-step the flow.
            <div className="flex h-9 items-center gap-2 rounded-md border border-line bg-card px-3 text-sm">
              <span className="font-medium">Draft</span>
              <span className="text-xs text-muted-foreground">
                Use Publish in the footer to make this product live.
              </span>
            </div>
          ) : (
            <Select
              value={currentKey}
              onValueChange={handleChange}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger className={controlSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {LIFECYCLE_STATUS_KEYS.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {currentHint && <FieldHint>{currentHint}</FieldHint>}
        </FormItem>
      </div>
    </>
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

  // Defensive: collapse any duplicate variants by id so React doesn't
  // see two children with the same key. The backend sometimes returns
  // a refreshed product where a freshly-created variant overlaps with
  // an in-flight optimistic copy.
  const uniqueVariants = useMemo(() => {
    const seen = new Map<string, ProductVariant>();
    for (const v of variants) {
      if (!seen.has(v.id)) seen.set(v.id, v);
    }
    return Array.from(seen.values());
  }, [variants]);

  const variant = useMemo(
    () => uniqueVariants.find((v) => v.id === selectedVariantId),
    [uniqueVariants, selectedVariantId],
  );

  // Filter the supported-currency list down to ones that aren't already
  // overridden for this variant + aren't the variant's native currency
  // (a native-currency override would be a no-op).
  const overriddenCodes = useMemo(
    () => new Set(overrides.map((o) => o.currency)),
    [overrides],
  );

  // Same defensive dedupe for overrides — the API can serve a stale
  // row alongside a fresh upsert briefly, and we'd rather show one
  // entry than crash with duplicate keys.
  const uniqueOverrides = useMemo(() => {
    const seen = new Map<string, (typeof overrides)[number]>();
    for (const o of overrides) {
      if (!seen.has(o.id)) seen.set(o.id, o);
    }
    return Array.from(seen.values());
  }, [overrides]);
  // Codes the picker should hide: every currency that already has an
  // override on this variant, plus the variant's native currency
  // (a native-currency override would be a no-op).
  const excludeCurrencyCodes = useMemo(
    () => [
      ...Array.from(overriddenCodes),
      ...(variant?.nativeCurrency ? [variant.nativeCurrency] : []),
    ],
    [overriddenCodes, variant],
  );

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

  return (
    <section className={styles.formCard}>
      <header className={styles.formCardHead}>
        <div className={styles.icoBox}>
          <Globe className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3>Currency price overrides</h3>
          <p className={styles.formCardHeadDesc}>
            Set explicit prices for non-native currencies. Without an override,
            orders use FX conversion of the variant&apos;s native price.
          </p>
        </div>
      </header>

      <div className={styles.formBody}>
        {/* Authoring row — 4 cells on a wide viewport, 2x2 on medium,
            single column on narrow phones. xl=1280px is the right
            breakpoint because the form's left column only gets enough
            room (~880px+) for 4 in a row at that viewport size; below
            that it gracefully falls back to 2x2. */}
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={styles.fieldLabel}>Variant</label>
            <Select
              value={selectedVariantId}
              onValueChange={setSelectedVariantId}
              disabled={busy}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {uniqueVariants.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.displayName || v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className={styles.fieldLabel}>Currency</label>
            <CurrencySelector
              value={draft.currency || null}
              onChange={(v) => setDraft({ ...draft, currency: v })}
              isDisabled={busy}
              placeholder="Pick a currency"
              excludeCodes={excludeCurrencyCodes}
            />
          </div>

          <div>
            <label className={styles.fieldLabel}>Price</label>
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
              placeholder="0.00"
            />
          </div>

          <Button
            type="button"
            className="h-10 w-full"
            onClick={add}
            disabled={busy || !draft.currency || !draft.price}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Save
          </Button>
        </div>

        {variant && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Native price for{" "}
            <span className="font-medium text-foreground">
              {variant.displayName || variant.name}
            </span>
            : {variant.price.toLocaleString()} {variant.nativeCurrency}
          </p>
        )}

        {/* Existing overrides */}
        <div className="mt-4 space-y-1.5">
          {loading ? (
            <p className="py-3 text-center text-xs text-muted-foreground">
              Loading…
            </p>
          ) : uniqueOverrides.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-line bg-card/50 px-3 py-2.5">
              <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs font-medium">No overrides yet</p>
                <p className="text-[11px] text-muted-foreground">
                  Use the row above to add a per-currency price.
                </p>
              </div>
            </div>
          ) : (
            uniqueOverrides.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-md border border-line bg-card px-3 py-1.5"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs font-medium uppercase tracking-wide">
                    {o.currency}
                  </span>
                  <span className="text-sm tabular-nums">
                    {o.price.toLocaleString()}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(o.currency)}
                  disabled={busy}
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                  title={`Remove ${o.currency} override`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
