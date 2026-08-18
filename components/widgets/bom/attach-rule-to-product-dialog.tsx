"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Link2, Loader2, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { controlComboboxTriggerClass } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { attachBomRule } from "@/lib/actions/bom-rule-actions";
import { fetchAllProducts } from "@/lib/actions/product-actions";
import type { Product } from "@/types/product/type";
import type { BomRule, BomRuleAttachment } from "@/types/bom/type";
import type { FormResponse } from "@/types/types";

interface Props {
  rule: BomRule;
  trigger: React.ReactNode;
  /** Optional callback fired after a successful attach (before refresh). */
  onAttached?: (attachment: BomRuleAttachment) => void;
}

interface VariantOption {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  searchString: string;
}

/**
 * Quick-attach dialog for binding an existing rule to a product variant.
 * Calls attachBomRule directly — no rule revision required, so this is
 * the right path for orphan rules created standalone or for adding a
 * second variant to an already-attached rule.
 */
export default function AttachRuleToProductDialog({
  rule,
  trigger,
  onAttached,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [variantId, setVariantId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  // Lazy load on first open.
  useEffect(() => {
    if (!open || products.length > 0 || productsLoading) return;
    setProductsLoading(true);
    fetchAllProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [open, products.length, productsLoading]);

  // Already-bound variants — exclude from the picker so we don't trip
  // the partial-unique-index on the open-attachment constraint.
  const alreadyAttached = useMemo(
    () =>
      new Set(
        (rule.attachments ?? [])
          .filter((a) => !a.effectiveTo && a.productVariantId)
          .map((a) => a.productVariantId as string),
      ),
    [rule.attachments],
  );

  const variantOptions: VariantOption[] = useMemo(
    () =>
      products.flatMap((p) =>
        (p.variants ?? [])
          .filter((v) => !v.archivedAt && !alreadyAttached.has(v.id))
          .map((v) => ({
            variantId: v.id,
            productId: p.id,
            productName: p.name,
            variantName: v.name,
            searchString: `${p.name} ${v.name}`.toLowerCase(),
          })),
      ),
    [products, alreadyAttached],
  );

  const selected = useMemo(
    () => variantOptions.find((o) => o.variantId === variantId) ?? null,
    [variantOptions, variantId],
  );

  const reset = () => {
    setVariantId("");
    setPickerOpen(false);
  };

  const onSubmit = () => {
    if (!variantId) return;
    startTransition(async () => {
      const result = (await attachBomRule(
        rule.id,
        {
          productVariantId: variantId,
          modifierOptionId: null,
          effectiveFrom: null,
          effectiveTo: null,
          notes: null,
        },
        selected?.productId,
      )) as FormResponse | undefined;

      if (result?.responseType === "success") {
        toast({
          variant: "default",
          title: "Recipe attached",
          description: result.message,
        });
        if (onAttached) onAttached(result.data as BomRuleAttachment);
        setOpen(false);
        reset();
        router.refresh();
      } else if (result?.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Could not attach",
          description: result.message,
        });
      }
    });
  };

  const isPickerEmpty = !productsLoading && variantOptions.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden"
        overlayClassName="bg-foreground/30 backdrop-blur-sm"
      >
        <DialogHeader className="space-y-1.5 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Link2 className="h-3.5 w-3.5" />
            </span>
            Attach to product variant
          </DialogTitle>
          <DialogDescription className="text-xs">
            Bind <span className="font-medium text-foreground">{rule.name}</span> to a product variant. Sales of that variant will deduct stock per the items in this rule.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-2">
          <label
            htmlFor="attach-variant-trigger"
            className="text-xs font-medium text-muted-foreground"
          >
            PRODUCT VARIANT
          </label>
          <Popover
            open={pickerOpen}
            onOpenChange={(o) => {
              // Allow closing always; only suppress opening when the
              // catalogue is still loading or empty (the trigger is also
              // disabled in those states, but be defensive).
              if (o && (isPickerEmpty || productsLoading)) return;
              setPickerOpen(o);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                id="attach-variant-trigger"
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={pickerOpen}
                disabled={productsLoading || isPending || isPickerEmpty}
                className={controlComboboxTriggerClass}
              >
                <span className="flex flex-1 items-center gap-2 truncate text-left">
                  {productsLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin opacity-60" />
                      <span className="text-muted-foreground">
                        Loading variants…
                      </span>
                    </>
                  ) : selected ? (
                    <span className="flex items-baseline gap-1.5 truncate">
                      <span className="truncate font-medium">
                        {selected.productName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {selected.variantName}
                      </span>
                    </span>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      <span className="text-muted-2">
                        Search products…
                      </span>
                    </>
                  )}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <Command>
                <CommandInput placeholder="Search by product or variant…" />
                <CommandList className="max-h-[260px]">
                  <CommandEmpty>No matching variants.</CommandEmpty>
                  <CommandGroup>
                    {variantOptions.map((o) => {
                      const isSelected = o.variantId === variantId;
                      return (
                        <CommandItem
                          key={o.variantId}
                          value={o.searchString}
                          onSelect={() => {
                            setVariantId(o.variantId);
                            setPickerOpen(false);
                          }}
                          className="items-start gap-2"
                        >
                          <Check
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              isSelected ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm">
                              {o.productName}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {o.variantName}
                            </span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {isPickerEmpty && (
            <p className="text-xs italic text-muted-foreground">
              No eligible variants — every active variant is already attached
              to this rule.
            </p>
          )}
          {!isPickerEmpty && !productsLoading && (
            <p className="text-[11px] text-muted-foreground">
              {variantOptions.length} variant
              {variantOptions.length === 1 ? "" : "s"} available · type to
              filter.
            </p>
          )}
        </div>

        <DialogFooter className="border-t bg-muted/30 px-6 py-3 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={!variantId || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Attaching…
              </>
            ) : (
              <>
                <Link2 className="mr-1.5 h-3.5 w-3.5" />
                Attach
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
