"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Barcode, Loader2 } from "lucide-react";
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
import {
  bulkGenerateProductBarcodes,
  bulkGenerateBarcodesForProduct,
} from "@/lib/actions/product-barcode-actions";

type Props =
  | {
      /** Generate for every variant of every product in the location. */
      scope: "all";
      /** Optional override of the trigger button label. */
      label?: string;
    }
  | {
      /** Generate for every variant of a single product. */
      scope: "product";
      productId: string;
      /** Used in dialog copy + the success toast count. */
      productName?: string;
      label?: string;
    };

/**
 * Single-action bulk barcode generator. Mirrors the stock-variants
 * equivalent so the products surface stays consistent. The dashboard
 * fires exactly one POST per click — fan-out happens server-side.
 *
 * Variants with an existing barcode are skipped, not overwritten.
 */
export function BulkBarcodeGenerator(props: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const isAll = props.scope === "all";
  const triggerLabel =
    props.label ?? (isAll ? "Bulk barcodes" : "Generate barcodes");
  const dialogTitle = isAll
    ? "Generate barcodes for every product variant?"
    : `Generate barcodes for ${
        props.scope === "product" && props.productName
          ? props.productName
          : "this product"
      }?`;
  const dialogDescription = isAll
    ? "Assigns a fresh EAN-13 to every active variant in this location that doesn't already have one. Existing barcodes aren't overwritten."
    : "Assigns a fresh EAN-13 to every active variant of this product that doesn't already have one. Existing barcodes aren't overwritten.";

  const run = () => {
    startTransition(async () => {
      try {
        const updated =
          props.scope === "all"
            ? await bulkGenerateProductBarcodes()
            : await bulkGenerateBarcodesForProduct(props.productId);

        toast({
          title: `${updated.length} barcode${updated.length === 1 ? "" : "s"} generated`,
          description:
            updated.length === 0
              ? "Every active variant already has a barcode."
              : "Variants without a barcode were assigned a new EAN-13.",
        });
        setConfirmOpen(false);
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Request failed";
        toast({
          variant: "destructive",
          title: "Bulk generation failed",
          description: message,
        });
      }
    });
  };

  return (
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Barcode className="h-4 w-4 mr-1.5" />
          )}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setConfirmOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={run} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
