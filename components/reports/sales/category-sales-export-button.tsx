"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { exportCategorySalesCsv } from "@/lib/actions/category-sales-actions";

interface Props {
  categoryId: string;
  categoryName: string;
  currency: string;
  from: string;
  to: string;
  disabled?: boolean;
}

/**
 * Exports the whole category (the full period, not just the visible page) to
 * CSV. Rows are built server-side by `exportCategorySalesCsv`; honours the
 * current `?search` so the export matches the table.
 */
export function CategorySalesExportButton({
  categoryId,
  categoryName,
  currency,
  from,
  to,
  disabled,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  const handleExport = () =>
    startTransition(async () => {
      try {
        const search = searchParams?.get("search") ?? undefined;
        const { csv, filename } = await exportCategorySalesCsv(
          categoryId,
          categoryName,
          from,
          to,
          currency,
          search,
        );
        // Lead with a BOM so Excel reads UTF-8 without mangling accents.
        const blob = new Blob(["\uFEFF", csv], {
          type: "text/csv;charset=utf-8",
        });
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(href);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Couldn't export",
          description:
            error instanceof Error ? error.message : "Request failed",
        });
      }
    });

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || isPending}
    >
      {isPending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-1.5 h-4 w-4" />
      )}
      Export CSV
    </Button>
  );
}
