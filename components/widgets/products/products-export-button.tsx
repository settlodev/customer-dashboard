"use client";

import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  exportProductsCsv,
  type ProductExportView,
} from "@/lib/actions/export-actions";

interface ProductsExportButtonProps {
  /** Tab being viewed — the export covers exactly this tab. */
  view?: ProductExportView;
  /** Active search term, so the download matches what's on screen. */
  search?: string;
}

/**
 * Downloads the catalogue as CSV, streamed from the inventory service.
 *
 * The file's leading columns are the PRODUCT import template, so the natural
 * bulk-edit loop is export → edit → /imports/products.
 */
export function ProductsExportButton({
  view = "ACTIVE",
  search,
}: ProductsExportButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const download = () =>
    startTransition(async () => {
      try {
        const { csv, filename } = await exportProductsCsv(view, search);
        // BOM makes Excel open UTF-8 files without mangling accented characters.
        const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(href);
        toast({ title: "Product export ready", description: filename });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Couldn't export products",
          description: error?.message ?? "Request failed",
        });
      }
    });

  return (
    <Button variant="outline" size="sm" onClick={download} disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-1.5" />
      )}
      Export CSV
    </Button>
  );
}
