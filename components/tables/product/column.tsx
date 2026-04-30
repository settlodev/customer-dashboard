"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "@/components/tables/product/cell-action";
import { ProductVariantRow } from "@/types/product/type";
import Image from "next/image";

// Deterministic colour for the prod-cell initials thumb. Mirrors the
// design palette: brand orange + a few inks/jewel tones so adjacent
// rows don't all look the same. Same input → same colour.
const THUMB_PALETTE = [
  "#EB7F44",
  "#0E8B5F",
  "#C4892B",
  "#1F1F1F",
  "#C8442A",
  "#6B2D5C",
  "#0E7C7B",
  "#C25E26",
  "#1E3A8A",
  "#525252",
];
function thumbColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return THUMB_PALETTE[hash % THUMB_PALETTE.length];
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return (
    parts
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "?"
  );
}

export const columns: ColumnDef<ProductVariantRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 32,
  },
  {
    accessorKey: "name",
    enableHiding: false,
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="xs"
        className="-ml-2 h-auto px-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground hover:text-ink"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Product
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => {
      const image = row.original.imageUrl;
      const isValidImageUrl =
        image &&
        (image.startsWith("http://") ||
          image.startsWith("https://") ||
          image.startsWith("/"));

      const sku = row.original.sku;
      const initials = initialsFor(row.original.name);
      const bg = thumbColor(row.original.id);

      return (
        <div className="flex min-w-[240px] items-center gap-3">
          {isValidImageUrl ? (
            <Image
              src={image}
              alt={row.original.name}
              className="h-9 w-9 flex-shrink-0 rounded-lg object-cover"
              width={36}
              height={36}
              loading="lazy"
            />
          ) : (
            <div
              className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg text-[14px] font-semibold tracking-tight text-white"
              style={{ backgroundColor: bg }}
              aria-hidden
            >
              {initials}
              {/* Subtle highlight matches the design's `.prod-thumb::after` */}
              <span
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.25), transparent 60%)",
                }}
              />
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-ink">
              {row.original.name}
            </div>
            {sku && (
              <div className="mt-0.5 truncate font-mono text-[10.5px] tracking-[0.02em] text-muted-foreground">
                {sku}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    id: "category",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Category</span>,
    cell: ({ row }) => {
      const categoryName = row.original.product.categories?.[0]?.name;
      return (
        <div className="hidden md:block">
          {categoryName ? (
            <Badge variant="soft">{categoryName}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      );
    },
  },
  {
    id: "brandName",
    enableHiding: true,
    header: () => <span className="hidden lg:inline">Brand</span>,
    cell: ({ row }) => (
      <div className="hidden text-ink-3 lg:block">
        {row.original.product.brandName || "—"}
      </div>
    ),
  },
  {
    id: "price",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Price</span>,
    cell: ({ row }) => (
      <div className="hidden items-baseline justify-end gap-1 font-mono tabular-nums text-ink md:flex">
        <span>{row.original.price.toLocaleString()}</span>
        <span className="text-[10.5px] text-muted-foreground">
          {row.original.nativeCurrency}
        </span>
      </div>
    ),
  },
  {
    id: "currentCost",
    enableHiding: true,
    header: () => <span className="hidden lg:inline">Cost</span>,
    cell: ({ row }) => {
      const cost = row.original._currentCost;
      const currency = row.original.nativeCurrency || "TZS";
      return (
        <div className="hidden items-baseline justify-end gap-1 font-mono tabular-nums text-ink-3 lg:flex">
          {cost != null ? (
            <>
              <span>
                {cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10.5px] text-muted-foreground">
                {currency}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      );
    },
  },
  {
    id: "stock",
    enableHiding: true,
    header: () => <span className="hidden md:inline">Stock level</span>,
    cell: ({ row }) => {
      const qty = row.original._sellableQty;
      const variantArchived = row.original.variantArchivedAt != null;
      if (variantArchived) {
        return (
          <span className="hidden text-muted-foreground md:inline">—</span>
        );
      }
      if (qty === "Unlimited") {
        return (
          <div className="hidden md:block">
            <Badge variant="soft">Unlimited</Badge>
          </div>
        );
      }
      if (qty === null || qty === undefined) {
        return (
          <span className="hidden text-muted-foreground md:inline">—</span>
        );
      }

      // Stock-bar — width capped at 100; uses warn / neg colours when
      // approaching empty so the eye snaps to issues without reading.
      const numeric = typeof qty === "number" ? qty : 0;
      // Without a per-product max from the API, lean on a sensible 100
      // cap for the visual bar. Anything ≥100 reads as "full".
      const max = Math.max(numeric, 100);
      const pct = Math.max(2, Math.min(100, (numeric / max) * 100));
      let fillTone: "ok" | "warn" | "bad";
      if (numeric <= 0) fillTone = "bad";
      else if (numeric < 10) fillTone = "warn";
      else fillTone = "ok";

      return (
        <div className="hidden items-center gap-2 md:flex">
          <span className="min-w-[38px] font-mono text-[12px] tabular-nums text-ink">
            {numeric.toLocaleString()}
          </span>
          <div className="relative h-1 w-[88px] overflow-hidden rounded-full bg-canvas">
            <div
              className={
                "absolute inset-y-0 left-0 rounded-full " +
                (fillTone === "bad"
                  ? "bg-neg"
                  : fillTone === "warn"
                    ? "bg-warn"
                    : "bg-pos")
              }
              style={{ width: pct + "%" }}
            />
          </div>
        </div>
      );
    },
  },
  {
    id: "stock-mode",
    enableHiding: true,
    header: () => <span className="hidden xl:inline">Mode</span>,
    cell: ({ row }) => {
      let variant: "soft" | "pos" | "warn" = "soft";
      let label = "—";
      if (row.original.unlimited) {
        variant = "soft";
        label = "Unlimited";
      } else if (row.original.stockLinkType === "DIRECT") {
        variant = "pos";
        label = "Direct";
      } else {
        // Tracked product without a DIRECT link → assumed RECIPE.
        variant = "warn";
        label = "Recipe";
      }
      return (
        <div className="hidden xl:block">
          <Badge variant={variant}>{label}</Badge>
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    enableHiding: true,
    cell: ({ row }) => {
      const productArchived = row.original.product.archivedAt != null;
      const variantArchived = row.original.variantArchivedAt != null;
      const isActive =
        row.original.product.active && row.original.variantActive;

      if (productArchived || variantArchived) {
        return (
          <Badge variant="soft">
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
            Archived
          </Badge>
        );
      }

      return (
        <Badge variant={isActive ? "pos" : "soft"}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    header: () => null,
    size: 40,
    cell: ({ row }) => (
      <div className="flex justify-end">
        {/* Actions act on the specific variant. Edit / View still navigate
            to the product page (those are product-level operations). The
            backend auto-archives the parent product when the last active
            variant is archived, so the merchant gets the expected behavior
            without a separate "archive product" action here. */}
        <CellAction
          data={row.original.product}
          variant={{
            id: row.original.variantId,
            name: row.original.name,
            archivedAt: row.original.variantArchivedAt,
          }}
        />
      </div>
    ),
  },
];
