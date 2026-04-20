"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Barcode, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { bulkGenerateBarcodes } from "@/lib/actions/barcode-actions";
import { ExportCsvButton } from "@/components/widgets/export-csv-button";

/**
 * Page-level actions for the stock-variants index page. Groups the primary
 * "Add Stock" CTA with CSV export and bulk barcode-generation so operators
 * don't have to jump between pages for bookkeeping tasks.
 */
export function StockVariantsHeaderActions() {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const runBulk = () => {
    startTransition(async () => {
      try {
        const updated = await bulkGenerateBarcodes();
        toast({
          title: `${updated.length} barcode${updated.length === 1 ? "" : "s"} generated`,
          description:
            updated.length === 0
              ? "Every active variant already has a barcode."
              : "Variants without a barcode were assigned a new EAN-13.",
        });
        setConfirmOpen(false);
        router.refresh();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Bulk generation failed",
          description: error?.message ?? "Request failed",
        });
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ExportCsvButton />
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Barcode className="h-4 w-4 mr-1.5" />
            )}
            Bulk barcodes
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate barcodes for every variant?</DialogTitle>
            <DialogDescription>
              Assigns a fresh EAN-13 to every active variant that doesn&apos;t
              already have one. Existing barcodes aren&apos;t overwritten.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={runBulk} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button asChild>
        <Link href="/stock-variants/new">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Stock
        </Link>
      </Button>
    </div>
  );
}
