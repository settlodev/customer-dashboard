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
import { z } from "zod";
import {
  Trash2,
  Plus,
  Package,
  Barcode as BarcodeIcon,
  Hash,
  Archive,
  ArchiveRestore,
  Loader2,
  Wand2,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  ImageIcon,
  ArrowUpFromLine,
  X as XIcon,
  CheckCircle2,
  FileText,
  Boxes,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { NumericFormat } from "react-number-format";
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
import {
  createStock,
  createStockWithProduct,
  updateStock,
  archiveStockVariant,
  unarchiveStockVariant,
  uploadStockImages,
  saveStockDraft,
  publishStock,
} from "@/lib/actions/stock-actions";
import { assignBarcode } from "@/lib/actions/barcode-actions";
import { getUnits } from "@/lib/actions/unit-actions";
import { fetchAllCategories } from "@/lib/actions/category-actions";
import type { Stock } from "@/types/stock/type";
import type { UnitOfMeasure } from "@/types/unit/type";
import type { Category } from "@/types/category/type";
import { StockSchema } from "@/types/stock/schema";
import type { FormResponse } from "@/types/types";
import UnitSelector from "@/components/widgets/unit-selector";
import SupplierSelector from "@/components/widgets/supplier-selector";
import { MultiSelect } from "@/components/ui/multi-select";
import { MATERIAL_TYPE_OPTIONS } from "@/types/catalogue/enums";
import { BusinessDayClosedDialog } from "@/components/widgets/business-day-closed-dialog";
import { useBusinessDayGuard } from "@/hooks/use-business-day-guard";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import { formatMoney } from "@/lib/helpers";

import styles from "./styles/form-shell.module.css";

interface StockFormProps {
  item: Stock | null | undefined;
  balances?: Record<
    string,
    { quantityOnHand: number; averageCost: number | null }
  >;
}

const DEFAULT_VARIANT = {
  name: "",
  serialTracked: false,
  archived: false,
  initialQuantity: 0,
  initialUnitCost: 0,
  reorderPoint: undefined as number | undefined,
  reorderQuantity: undefined as number | undefined,
  preferredSupplierId: "",
  lowStockThreshold: undefined as number | undefined,
  overstockThreshold: undefined as number | undefined,
  sellingPrice: undefined as number | undefined,
};

interface GalleryImage {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

export default function StockForm({ item, balances }: StockFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<FormResponse | undefined>();
  const businessDayGuard = useBusinessDayGuard();
  const [archivingIndex, setArchivingIndex] = useState<number | null>(null);
  const [generatingBarcode, setGeneratingBarcode] = useState<number | null>(null);
  const [reorderOpen, setReorderOpen] = useState<Record<number, boolean>>({});
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const { toast } = useToast();

  // ── Auto-create matching product (create-mode only) ───────────────
  // Off by default — most stock items in restaurant POS are raw
  // materials (flour, oil) that don't need a sellable product. The
  // merchant flips this on when the stock IS the sellable thing
  // (bottled drinks, packaged goods). Selling price lives per-variant
  // (variants[i].sellingPrice) so Coca-Cola 330ml and 500ml are priced
  // independently.
  const [autoCreateProduct, setAutoCreateProduct] = useState<boolean>(false);
  // Categories are required by the product side when autoCreateProduct is on.
  // Held outside the form because they're not part of StockSchema — they
  // travel as productOptions to createStockWithProduct.
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const locationCurrency = useLocationCurrency();

  const isEditing = !!item;
  const lastSyncedNameRef = useRef("");

  useEffect(() => {
    getUnits().then(setUnits);
  }, []);

  // Lazy-load categories the first time the merchant flips on
  // autoCreateProduct, so create-only-stock flows skip the round-trip.
  useEffect(() => {
    if (!autoCreateProduct || categories.length > 0) return;
    fetchAllCategories()
      .then((c) => setCategories(c ?? []))
      .catch(() => setCategories([]));
  }, [autoCreateProduct, categories.length]);

  const unitMap = useMemo(
    () => new Map(units.map((u) => [u.id, u])),
    [units],
  );

  const form = useForm<z.infer<typeof StockSchema>>({
    resolver: zodResolver(StockSchema),
    defaultValues: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      baseUnitId: item?.baseUnitId ?? "",
      materialType: item?.materialType ?? "FINISHED_GOOD",
      imageUrl: item?.imageUrl ?? "",
      variants: item?.variants?.length
        ? item.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku ?? undefined,
            barcode: v.barcode ?? undefined,
            serialTracked: v.serialTracked,
            archived: v.archived,
            initialQuantity: 0,
            initialUnitCost: 0,
            serialNumbers: [] as string[],
            reorderPoint: undefined as number | undefined,
            reorderQuantity: undefined as number | undefined,
            preferredSupplierId: "",
            lowStockThreshold: undefined as number | undefined,
            overstockThreshold: undefined as number | undefined,
            sellingPrice: undefined as number | undefined,
          }))
        : [DEFAULT_VARIANT],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const stockName = form.watch("name");
  const baseUnitId = form.watch("baseUnitId");
  const materialType = form.watch("materialType");
  // useWatch (vs form.watch) for the variants array so nested field updates
  // — especially sellingPrice typed inside <NumericFormat> — reliably
  // re-trigger the readiness memo.
  const watchedVariants = useWatch({
    control: form.control,
    name: "variants",
  });

  // Auto-sync stock name → first variant name (single-variant create flow)
  useEffect(() => {
    if (isEditing || fields.length > 1) return;
    const current = form.getValues("variants.0.name");
    if (current === "" || current === lastSyncedNameRef.current) {
      form.setValue("variants.0.name", stockName || "");
      lastSyncedNameRef.current = stockName || "";
    }
  }, [stockName, isEditing, fields.length, form]);

  const handleVariantArchive = async (index: number, shouldArchive: boolean) => {
    const variantId = form.getValues(`variants.${index}.id`);
    if (!variantId || !item) return;
    setArchivingIndex(index);
    try {
      if (shouldArchive) {
        await archiveStockVariant(item.id, variantId);
        form.setValue(`variants.${index}.archived`, true);
        toast({ title: "Archived", description: "Variant has been archived." });
      } else {
        await unarchiveStockVariant(item.id, variantId);
        form.setValue(`variants.${index}.archived`, false);
        toast({ title: "Restored", description: "Variant has been restored." });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${shouldArchive ? "archive" : "restore"} variant.`,
      });
    } finally {
      setArchivingIndex(null);
    }
  };

  const handleGenerateBarcode = async (index: number) => {
    const variantId = form.getValues(`variants.${index}.id`);
    if (!variantId) return;
    setGeneratingBarcode(index);
    try {
      const updated = await assignBarcode(variantId);
      if (updated?.barcode) {
        form.setValue(`variants.${index}.barcode`, updated.barcode);
        toast({ title: "Barcode generated", description: updated.barcode });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate barcode.",
      });
    } finally {
      setGeneratingBarcode(null);
    }
  };

  const onInvalid = useCallback(
    (_errors: FieldErrors) => {
      toast({
        variant: "destructive",
        title: "Validation failed",
        description: "Please check your inputs.",
      });
    },
    [toast],
  );

  const submitData = (values: z.infer<typeof StockSchema>) => {
    setResponse(undefined);
    runSubmit(values);
  };

  const runSubmit = (values: z.infer<typeof StockSchema>) => {
    startTransition(() => {
      if (item) {
        const currentIds = new Set(
          values.variants.map((v) => v.id).filter(Boolean),
        );
        const removed = (item.variants || [])
          .map((v) => v.id)
          .filter((vid) => !currentIds.has(vid));
        updateStock(item.id, values, removed).then((d) => {
          if (businessDayGuard.catch(d, () => runSubmit(values))) return;
          if (d) setResponse(d);
        });
      } else if (autoCreateProduct) {
        createStockWithProduct(values, { categoryIds }).then((d) => {
          if (businessDayGuard.catch(d, () => runSubmit(values))) return;
          if (d) setResponse(d);
        });
      } else {
        createStock(values).then((d) => {
          if (businessDayGuard.catch(d, () => runSubmit(values))) return;
          if (d) setResponse(d);
        });
      }
    });
  };

  const handleAddVariant = () => {
    append({ ...DEFAULT_VARIANT });
  };

  // ── Image gallery ──────────────────────────────────────────────────
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [primaryIdx, setPrimaryIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
            new Promise<GalleryImage>((res, rej) => {
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
          const urls = await uploadStockImages(loaded.map((l) => l.dataUrl));
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

  // Sync primary image into form's imageUrl
  useEffect(() => {
    const primary = galleryImages[primaryIdx];
    form.setValue("imageUrl", primary?.dataUrl ?? "", { shouldDirty: true });
  }, [galleryImages, primaryIdx, form]);

  // Readiness checklist. The four mandatory items gate submit; "Variant
  // prices" is advisory — it's tracked in the checklist for visibility but
  // does NOT block submission. Inline warnings on the price input itself
  // surface mispricing (qty>0+price=0, price<cost). When autoCreateProduct
  // is on, "Categories" is also mandatory (the product side rejects
  // uncategorised products).
  const allVariantsNamed = useMemo(() => {
    const active = (watchedVariants ?? []).filter((v) => !v?.archived);
    if (active.length === 0) return false;
    return active.every((v) => !!v?.name?.trim());
  }, [watchedVariants]);
  const requiredFilled = useMemo(
    () => [
      !!stockName?.trim(),
      !!baseUnitId,
      !!watchedVariants?.[0]?.name?.trim(),
      allVariantsNamed,
      ...(autoCreateProduct ? [categoryIds.length > 0] : []),
    ],
    [
      stockName,
      baseUnitId,
      watchedVariants,
      allVariantsNamed,
      autoCreateProduct,
      categoryIds,
    ],
  );
  const advisoryAllPriced = useMemo(() => {
    if (!autoCreateProduct) return null;
    const active = (watchedVariants ?? []).filter((v) => !v?.archived);
    if (active.length === 0) return false;
    return active.every((v) => {
      const n = Number(v?.sellingPrice);
      return Number.isFinite(n) && n > 0;
    });
  }, [watchedVariants, autoCreateProduct]);
  const checklistItems =
    advisoryAllPriced === null
      ? requiredFilled
      : [...requiredFilled, advisoryAllPriced];
  const completion = Math.round(
    (checklistItems.filter(Boolean).length / checklistItems.length) * 100,
  );
  const isValid = requiredFilled.every(Boolean);
  const remainingFields = requiredFilled.filter((v) => !v).length;

  const baseUnitAbbr = unitMap.get(baseUnitId ?? "")?.abbreviation ?? "";
  const materialTypeLabel =
    MATERIAL_TYPE_OPTIONS.find((m) => m.value === materialType)?.label ??
    materialType;

  const handleSaveAsDraft = useCallback(() => {
    startTransition(async () => {
      const result = await saveStockDraft(form.getValues(), item?.id);
      if (result?.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't save draft",
          description: result.message,
        });
        return;
      }
      toast({ title: "Draft saved" });
      // First save returns the freshly-created stock so we can pin its id
      // on the URL — subsequent saves PUT against /stocks/{id}.
      const newId = (result?.data as { id?: string } | undefined)?.id;
      if (!item?.id && newId) {
        router.replace(`/stock-variants/${newId}/edit`);
      }
    });
  }, [form, item?.id, router, toast]);

  const handlePublish = useCallback(() => {
    if (!item?.id) return;
    startTransition(async () => {
      const result = await publishStock(item.id);
      if (result?.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't publish stock",
          description: result.message,
        });
        return;
      }
      toast({ title: "Stock published" });
      router.push("/stock-variants");
    });
  }, [item?.id, router, toast]);

  const isDraftStock = item?.draft === true;

  const handleDiscard = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <>
      <BusinessDayClosedDialog
        open={businessDayGuard.dialogOpen}
        locationId={businessDayGuard.locationId}
        reason={businessDayGuard.reason}
        onDismiss={businessDayGuard.close}
        onDayOpened={businessDayGuard.onDayOpened}
      />
      <Form {...form}>
        {response?.responseType === "error" && response?.message ? (
          <Alert tone="danger" className="mb-3">
            <AlertIcon>
              <AlertTriangle className="h-3.5 w-3.5" />
            </AlertIcon>
            <AlertBody>
              <AlertTitle>We couldn&apos;t save this stock item</AlertTitle>
              <AlertDescription>{response.message}</AlertDescription>
            </AlertBody>
          </Alert>
        ) : null}
        <form
          onSubmit={form.handleSubmit(submitData, onInvalid)}
          className={styles.formRoot}
        >
          <div className={styles.formGrid}>
            {/* ── LEFT — form column ─────────────────────────────── */}
            <div className={styles.formStack}>
              <section className={styles.formCard}>
                <header className={styles.formCardHead}>
                  <div className={styles.icoBox}>
                    <Package className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3>Stock details</h3>
                    <p className={styles.formCardHeadDesc}>
                      Identifies the item across orders, recipes, and reports.
                    </p>
                  </div>
                  <div className={styles.formCardActions}>
                    <span className={styles.stepBadge}>STEP 01</span>
                  </div>
                </header>

                <div className={styles.formBody}>
                  <div
                    className={styles.fieldRow}
                    style={{ ["--cols" as never]: 3 } as React.CSSProperties}
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="min-w-0">
                          <FormLabel className={styles.fieldLabel}>
                            Stock name <span className="req">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className={styles.inputWithPrefix}>
                              <span className={styles.inputPrefix}>
                                <Package className="h-3.5 w-3.5" />
                              </span>
                              <Input
                                placeholder="e.g. Flour, Cooking Oil"
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
                      name="materialType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={styles.fieldLabel}>
                            Material type
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MATERIAL_TYPE_OPTIONS.map((o) => (
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
                      name="baseUnitId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={styles.fieldLabel}>
                            Base unit <span className="req">*</span>
                          </FormLabel>
                          <FormControl>
                            <UnitSelector
                              value={field.value}
                              onChange={field.onChange}
                              isDisabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className={styles.fieldRow} style={{ marginTop: 14 }}>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-2 min-w-0">
                          <FormLabel className={styles.fieldLabel}>
                            Description
                            <span className="opt">OPTIONAL</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Notes for buyers, recipes, or storage."
                              rows={2}
                              {...field}
                              value={field.value ?? ""}
                              disabled={isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {!isEditing && (
                    <div className="mt-4 space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <FormLabel className="text-sm font-medium text-foreground">
                            Also create a sellable product
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Use when this stock item IS the sellable thing
                            (bottled drinks, packaged goods). Creates a
                            matching product with one variant per stock
                            variant, linked 1:1 with the selling price you
                            set on each variant below. Leave off for raw
                            materials consumed by recipes.
                          </p>
                        </div>
                        <Switch
                          checked={autoCreateProduct}
                          onCheckedChange={setAutoCreateProduct}
                          disabled={isPending}
                        />
                      </div>

                      {autoCreateProduct && (
                        <div className="space-y-1">
                          <FormLabel className="text-xs">
                            Categories{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <MultiSelect
                            options={categories.map((c) => ({
                              label: c.name,
                              value: c.id,
                            }))}
                            onValueChange={setCategoryIds}
                            defaultValue={categoryIds}
                            placeholder="Pick at least one category"
                            maxCount={5}
                          />
                          {categoryIds.length === 0 && (
                            <p className="text-[11px] text-muted-foreground">
                              Categorisation drives reports, addons, and tax
                              rules.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section className={styles.formCard}>
                <header className={styles.formCardHead}>
                  <div className={styles.icoBox}>
                    <Boxes className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3>Variants</h3>
                    <p className={styles.formCardHeadDesc}>
                      Different packaging sizes or units of this stock item.
                    </p>
                  </div>
                  <div className={styles.formCardActions}>
                    <span className={styles.stepBadge}>STEP 02</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddVariant}
                      disabled={isPending}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add variant
                    </Button>
                  </div>
                </header>

                <div className={styles.formBody}>
                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const variantId = watchedVariants?.[index]?.id;
                      const isArchived = !!watchedVariants?.[index]?.archived;
                      const isExisting = !!variantId;
                      const isDisabled = isPending || isArchived;
                      const bal = variantId && balances ? balances[variantId] : null;
                      const origVariant = item?.variants?.find(
                        (v) => v.id === variantId,
                      );

                      return (
                        <div
                          key={field.id}
                          className={`border rounded-lg p-4 space-y-3 transition-opacity ${
                            isArchived
                              ? "bg-gray-100/80 dark:bg-gray-900/60 opacity-70"
                              : "bg-gray-50/40 dark:bg-gray-900/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Variant {index + 1}
                              </span>
                              {index === 0 &&
                                fields.length === 1 &&
                                !isEditing && (
                                  <span className="text-xs font-normal text-muted-foreground">
                                    (default)
                                  </span>
                                )}
                              {origVariant?.isDefault && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-medium">
                                  Default
                                </span>
                              )}
                              {isArchived && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                  Archived
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {isEditing && isExisting && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleVariantArchive(index, !isArchived)
                                  }
                                  disabled={
                                    isPending || archivingIndex !== null
                                  }
                                  className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                                    isArchived
                                      ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                      : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                  }`}
                                >
                                  {archivingIndex === index ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : isArchived ? (
                                    <ArchiveRestore className="w-3.5 h-3.5" />
                                  ) : (
                                    <Archive className="w-3.5 h-3.5" />
                                  )}
                                  <span>
                                    {isArchived ? "Unarchive" : "Archive"}
                                  </span>
                                </button>
                              )}
                              {fields.length > 1 && !isArchived && (
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  disabled={isPending}
                                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {isEditing && bal && (
                            <div className="flex gap-4 text-xs bg-blue-50/50 dark:bg-blue-950/20 rounded px-3 py-2">
                              <span className="text-muted-foreground">
                                Qty:{" "}
                                <strong className="text-foreground">
                                  {bal.quantityOnHand.toLocaleString()}
                                </strong>
                              </span>
                              {bal.averageCost != null && bal.averageCost > 0 && (
                                <span className="text-muted-foreground">
                                  Avg Cost:{" "}
                                  <strong className="text-foreground">
                                    {formatMoney(
                                      bal.averageCost,
                                      locationCurrency,
                                    )}
                                  </strong>
                                </span>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <FormField
                              control={form.control}
                              name={`variants.${index}.name`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">
                                    Name <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g. 50kg Bag, 1L Bottle"
                                      {...f}
                                      disabled={isDisabled}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`variants.${index}.barcode`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Barcode</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <BarcodeIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                      <Input
                                        className="pl-10 pr-10"
                                        placeholder="Optional"
                                        {...f}
                                        value={f.value ?? ""}
                                        disabled={isDisabled}
                                      />
                                      {isEditing && isExisting && !f.value && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleGenerateBarcode(index)
                                          }
                                          disabled={
                                            isPending ||
                                            generatingBarcode !== null
                                          }
                                          className="absolute right-2 top-2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                          title="Generate barcode"
                                        >
                                          {generatingBarcode === index ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Wand2 className="w-4 h-4" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`variants.${index}.sku`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">SKU</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                      <Input
                                        className="pl-10"
                                        placeholder="Optional"
                                        {...f}
                                        value={f.value ?? ""}
                                        disabled={isDisabled}
                                      />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          {!isEditing && (
                            <div
                              className={`grid grid-cols-1 gap-3 ${
                                autoCreateProduct
                                  ? "sm:grid-cols-3"
                                  : "sm:grid-cols-2"
                              }`}
                            >
                              <FormField
                                control={form.control}
                                name={`variants.${index}.initialQuantity`}
                                render={({ field: f }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">
                                      Initial quantity
                                    </FormLabel>
                                    <FormControl>
                                      <NumericFormat
                                        className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm"
                                        value={f.value}
                                        onValueChange={(v) =>
                                          f.onChange(v.floatValue ?? 0)
                                        }
                                        thousandSeparator
                                        placeholder="0"
                                        disabled={isPending}
                                        decimalScale={
                                          watchedVariants?.[index]?.serialTracked
                                            ? 0
                                            : 6
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`variants.${index}.initialUnitCost`}
                                render={({ field: f }) => {
                                  const variant = watchedVariants?.[index];
                                  const qty = Number(variant?.initialQuantity);
                                  const cost = Number(f.value);
                                  const showQtyNoCost =
                                    Number.isFinite(qty) &&
                                    qty > 0 &&
                                    !(Number.isFinite(cost) && cost > 0);
                                  return (
                                    <FormItem>
                                      <FormLabel className="text-xs">
                                        Initial unit cost ({locationCurrency})
                                      </FormLabel>
                                      <FormControl>
                                        <NumericFormat
                                          className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm"
                                          value={f.value}
                                          onValueChange={(v) =>
                                            f.onChange(v.floatValue ?? 0)
                                          }
                                          thousandSeparator
                                          placeholder="0"
                                          disabled={isPending}
                                          decimalScale={4}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                      {showQtyNoCost && (
                                        <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
                                          <AlertTriangle className="h-3 w-3 shrink-0" />
                                          Stock has quantity but no cost.
                                        </p>
                                      )}
                                    </FormItem>
                                  );
                                }}
                              />
                              {autoCreateProduct && (
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.sellingPrice`}
                                  render={({ field: f }) => {
                                    const variant = watchedVariants?.[index];
                                    const cost = Number(variant?.initialUnitCost);
                                    const price = Number(f.value);
                                    const hasPrice =
                                      Number.isFinite(price) && price > 0;
                                    const hasCost =
                                      Number.isFinite(cost) && cost > 0;
                                    const showBelowCost =
                                      hasPrice && hasCost && price < cost;
                                    return (
                                      <FormItem>
                                        <FormLabel className="text-xs">
                                          Selling price ({locationCurrency})
                                        </FormLabel>
                                        <FormControl>
                                          <NumericFormat
                                            className="flex h-10 w-full rounded-md border-0 bg-muted px-3 py-2 text-sm"
                                            value={f.value ?? ""}
                                            onValueChange={(v) =>
                                              f.onChange(v.floatValue)
                                            }
                                            thousandSeparator
                                            decimalScale={2}
                                            allowNegative={false}
                                            placeholder="0.00"
                                            disabled={isPending}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                        {showBelowCost && (
                                          <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
                                            <AlertTriangle className="h-3 w-3 shrink-0" />
                                            Below unit cost (
                                            {formatMoney(cost, locationCurrency)}
                                            ) — selling at a loss.
                                          </p>
                                        )}
                                      </FormItem>
                                    );
                                  }}
                                />
                              )}
                            </div>
                          )}

                          <FormField
                            control={form.control}
                            name={`variants.${index}.serialTracked`}
                            render={({ field: f }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={f.value}
                                    onCheckedChange={f.onChange}
                                    disabled={isDisabled}
                                  />
                                </FormControl>
                                <FormLabel className="text-xs cursor-pointer">
                                  Serial number tracking
                                </FormLabel>
                              </FormItem>
                            )}
                          />

                          {!isEditing &&
                            watchedVariants?.[index]?.serialTracked &&
                            (watchedVariants?.[index]?.initialQuantity ?? 0) >
                              0 &&
                            (() => {
                              const qty = Math.floor(
                                watchedVariants[index].initialQuantity ?? 0,
                              );
                              const serials =
                                watchedVariants?.[index]?.serialNumbers ?? [];
                              const count = serials.filter((s) => s.trim()).length;
                              const isValidCount = count === qty;

                              return (
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.serialNumbers`}
                                  render={({ field: f }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">
                                        Serial numbers
                                        <span
                                          className={`ml-2 text-[10px] font-normal ${
                                            isValidCount
                                              ? "text-green-600"
                                              : "text-amber-600"
                                          }`}
                                        >
                                          {count}/{qty} entered
                                        </span>
                                      </FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder={`Enter ${qty} serial number${qty > 1 ? "s" : ""}, one per line`}
                                          rows={Math.min(qty + 1, 8)}
                                          value={(f.value ?? []).join("\n")}
                                          onChange={(e) => {
                                            const lines = e.target.value.split("\n");
                                            f.onChange(lines);
                                          }}
                                          disabled={isPending}
                                          className="font-mono text-sm"
                                        />
                                      </FormControl>
                                      {!isValidCount && count > 0 && (
                                        <p className="text-[11px] text-amber-600">
                                          {count < qty
                                            ? `${qty - count} more needed`
                                            : `Too many — remove ${count - qty}`}
                                        </p>
                                      )}
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              );
                            })()}

                          {!isEditing &&
                            (() => {
                              const isOpen = reorderOpen[index] ?? false;
                              const row = watchedVariants?.[index];
                              const hasAnyValue =
                                row?.reorderPoint != null ||
                                row?.reorderQuantity != null ||
                                (row?.preferredSupplierId &&
                                  row.preferredSupplierId.length > 0) ||
                                row?.lowStockThreshold != null ||
                                row?.overstockThreshold != null;
                              const baseUnit = unitMap.get(baseUnitId ?? "");
                              const unitAbbr = baseUnit?.abbreviation ?? "";

                              return (
                                <div className="border-t pt-3 mt-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReorderOpen((prev) => ({
                                        ...prev,
                                        [index]: !isOpen,
                                      }))
                                    }
                                    className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-gray-900"
                                  >
                                    {isOpen ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                    <SlidersHorizontal className="h-3 w-3" />
                                    Reorder &amp; alert config
                                    <span className="font-normal text-muted-foreground">
                                      ({hasAnyValue ? "set" : "optional"})
                                    </span>
                                  </button>

                                  {isOpen && (
                                    <div className="mt-3 space-y-3 rounded-md border bg-gray-50/50 p-3">
                                      <p className="text-[11px] text-muted-foreground">
                                        Tells the system when to alert and
                                        auto-generate an LPO. Safe to leave
                                        empty — set these any time from the
                                        stock detail page.
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <FormField
                                          control={form.control}
                                          name={`variants.${index}.reorderPoint`}
                                          render={({ field: f }) => (
                                            <FormItem>
                                              <FormLabel className="text-xs">
                                                Reorder point
                                              </FormLabel>
                                              <FormControl>
                                                <NumericFormat
                                                  className="flex h-10 w-full rounded-md border-0 bg-white px-3 py-2 text-sm"
                                                  value={f.value ?? ""}
                                                  onValueChange={(v) =>
                                                    f.onChange(
                                                      v.value === ""
                                                        ? undefined
                                                        : Number(v.value),
                                                    )
                                                  }
                                                  thousandSeparator
                                                  decimalScale={6}
                                                  allowNegative={false}
                                                  placeholder="e.g. 20"
                                                  disabled={isPending}
                                                  suffix={
                                                    unitAbbr
                                                      ? ` ${unitAbbr}`
                                                      : undefined
                                                  }
                                                />
                                              </FormControl>
                                              <p className="text-[11px] text-muted-foreground">
                                                Fires an LPO when available ≤ this.
                                              </p>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={form.control}
                                          name={`variants.${index}.reorderQuantity`}
                                          render={({ field: f }) => (
                                            <FormItem>
                                              <FormLabel className="text-xs">
                                                Reorder quantity
                                              </FormLabel>
                                              <FormControl>
                                                <NumericFormat
                                                  className="flex h-10 w-full rounded-md border-0 bg-white px-3 py-2 text-sm"
                                                  value={f.value ?? ""}
                                                  onValueChange={(v) =>
                                                    f.onChange(
                                                      v.value === ""
                                                        ? undefined
                                                        : Number(v.value),
                                                    )
                                                  }
                                                  thousandSeparator
                                                  decimalScale={6}
                                                  allowNegative={false}
                                                  placeholder="e.g. 100"
                                                  disabled={isPending}
                                                  suffix={
                                                    unitAbbr
                                                      ? ` ${unitAbbr}`
                                                      : undefined
                                                  }
                                                />
                                              </FormControl>
                                              <p className="text-[11px] text-muted-foreground">
                                                How much the LPO orders.
                                              </p>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>

                                      <FormField
                                        control={form.control}
                                        name={`variants.${index}.preferredSupplierId`}
                                        render={({ field: f }) => (
                                          <FormItem>
                                            <FormLabel className="text-xs">
                                              Preferred supplier
                                            </FormLabel>
                                            <FormControl>
                                              <SupplierSelector
                                                label="Preferred supplier"
                                                placeholder="Optional — drives the auto-generated LPO"
                                                value={f.value ?? ""}
                                                onChange={f.onChange}
                                                onBlur={() => {}}
                                                isDisabled={isPending}
                                              />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <FormField
                                          control={form.control}
                                          name={`variants.${index}.lowStockThreshold`}
                                          render={({ field: f }) => (
                                            <FormItem>
                                              <FormLabel className="text-xs">
                                                Low-stock threshold
                                              </FormLabel>
                                              <FormControl>
                                                <NumericFormat
                                                  className="flex h-10 w-full rounded-md border-0 bg-white px-3 py-2 text-sm"
                                                  value={f.value ?? ""}
                                                  onValueChange={(v) =>
                                                    f.onChange(
                                                      v.value === ""
                                                        ? undefined
                                                        : Number(v.value),
                                                    )
                                                  }
                                                  thousandSeparator
                                                  decimalScale={6}
                                                  allowNegative={false}
                                                  placeholder="e.g. 10"
                                                  disabled={isPending}
                                                  suffix={
                                                    unitAbbr
                                                      ? ` ${unitAbbr}`
                                                      : undefined
                                                  }
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={form.control}
                                          name={`variants.${index}.overstockThreshold`}
                                          render={({ field: f }) => (
                                            <FormItem>
                                              <FormLabel className="text-xs">
                                                Overstock threshold
                                              </FormLabel>
                                              <FormControl>
                                                <NumericFormat
                                                  className="flex h-10 w-full rounded-md border-0 bg-white px-3 py-2 text-sm"
                                                  value={f.value ?? ""}
                                                  onValueChange={(v) =>
                                                    f.onChange(
                                                      v.value === ""
                                                        ? undefined
                                                        : Number(v.value),
                                                    )
                                                  }
                                                  thousandSeparator
                                                  decimalScale={6}
                                                  allowNegative={false}
                                                  placeholder="e.g. 500"
                                                  disabled={isPending}
                                                  suffix={
                                                    unitAbbr
                                                      ? ` ${unitAbbr}`
                                                      : undefined
                                                  }
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>

            {/* ── RIGHT — preview + media ──────────────────────── */}
            <aside className={styles.formStack}>
              <StockPreviewCard
                name={stockName ?? ""}
                materialTypeLabel={materialTypeLabel}
                baseUnitAbbr={baseUnitAbbr}
                variantCount={fields.length}
                primaryImageUrl={galleryImages[primaryIdx]?.dataUrl}
                checklist={[
                  { label: "Stock name", done: requiredFilled[0] },
                  { label: "Base unit", done: requiredFilled[1] },
                  { label: "Variant name", done: requiredFilled[2] },
                  { label: "Variant unit", done: requiredFilled[3] },
                  ...(autoCreateProduct
                    ? [
                        {
                          label: "Categories",
                          done: categoryIds.length > 0,
                        },
                        {
                          label: "Variant prices",
                          done: !!advisoryAllPriced,
                        },
                      ]
                    : []),
                ]}
                completion={completion}
              />

              <StockMediaCard
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

          {/* ── Sticky footer ──────────────────────────────────── */}
          <div className={styles.formFoot}>
            <div className={styles.formFootSpacer} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isPending}
                  title="Discard changes and go back"
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
            {isEditing && isDraftStock && (
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
                  ? isEditing
                    ? "Save changes"
                    : autoCreateProduct
                      ? "Create stock + product"
                      : "Create stock item"
                  : `Complete required fields (${remainingFields} remaining)`
              }
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              {isEditing
                ? "Save changes"
                : autoCreateProduct
                  ? "Create stock + product"
                  : "Create stock"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Live preview card — right column
// ─────────────────────────────────────────────────────────────────────

interface StockPreviewCardProps {
  name: string;
  materialTypeLabel: string;
  baseUnitAbbr: string;
  variantCount: number;
  primaryImageUrl?: string;
  checklist: Array<{ label: string; done: boolean }>;
  completion: number;
}

function StockPreviewCard({
  name,
  materialTypeLabel,
  baseUnitAbbr,
  variantCount,
  primaryImageUrl,
  checklist,
  completion,
}: StockPreviewCardProps) {
  const initials = useMemo(() => {
    const trimmed = (name || "Stock").trim();
    const parts = trimmed.split(/\s+/).slice(0, 2);
    const out = parts.map((w) => w[0]?.toUpperCase() ?? "").join("");
    return out || "ST";
  }, [name]);

  const metaLine = [
    materialTypeLabel?.toUpperCase() || "MATERIAL",
    baseUnitAbbr ? `BASE ${baseUnitAbbr.toUpperCase()}` : "NO BASE UNIT",
  ].join(" · ");

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
          {name?.trim() ? name : "Untitled stock item"}
        </div>
        <div className={styles.previewMeta}>{metaLine}</div>
        <div className={styles.previewPrice}>
          <span className={styles.previewPriceNum}>{variantCount}</span>
          <span className={styles.previewPriceCurr}>
            {variantCount === 1 ? "VARIANT" : "VARIANTS"}
          </span>
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
// Media card — drag-drop hero zone + 4-thumb gallery rail (5 max)
// ─────────────────────────────────────────────────────────────────────

interface StockMediaCardProps {
  images: GalleryImage[];
  primaryIdx: number;
  setPrimaryIdx: (i: number) => void;
  handleFiles: (files: FileList | File[] | null | undefined) => void;
  removeImage: (e: React.MouseEvent | undefined, i: number) => void;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
}

function StockMediaCard({
  images,
  primaryIdx,
  setPrimaryIdx,
  handleFiles,
  removeImage,
  dragOver,
  setDragOver,
  fileInputRef,
}: StockMediaCardProps) {
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
