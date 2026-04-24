"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Barcode, Loader2, Printer, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  assignBarcode,
  getBarcodeImageDataUrl,
} from "@/lib/actions/barcode-actions";

interface Props {
  variantId: string;
  variantName: string;
  barcode?: string | null;
  sku?: string | null;
  /** Disables assign/generate controls when the variant is archived etc. */
  disabled?: boolean;
}

/**
 * Compact per-variant barcode widget. Shows the current code + a PNG preview
 * when set, otherwise exposes assign / auto-generate actions. A second dialog
 * renders a simple printable label layout for handheld label printers.
 */
export function BarcodeManager({
  variantId,
  variantName,
  barcode,
  sku,
  disabled = false,
}: Props) {
  const [manageOpen, setManageOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  if (!barcode) {
    return (
      <BarcodeManageDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        variantId={variantId}
        variantName={variantName}
        barcode={null}
        disabled={disabled}
        trigger={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            disabled={disabled}
          >
            <Barcode className="h-3 w-3" />
            Assign
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-gray-700 whitespace-nowrap">
        {barcode}
      </span>
      <BarcodeManageDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        variantId={variantId}
        variantName={variantName}
        barcode={barcode}
        disabled={disabled}
        trigger={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Manage barcode"
          >
            <Barcode className="h-3 w-3" />
          </Button>
        }
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setPrintOpen(true)}
        title="Print label"
      >
        <Printer className="h-3 w-3" />
      </Button>
      <BarcodePrintDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
        variantName={variantName}
        barcode={barcode}
        sku={sku}
      />
    </div>
  );
}

function BarcodeManageDialog({
  open,
  onOpenChange,
  variantId,
  variantName,
  barcode,
  disabled,
  trigger,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  variantId: string;
  variantName: string;
  barcode: string | null;
  disabled: boolean;
  trigger: React.ReactNode;
}) {
  const [custom, setCustom] = useState("");
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!open || !barcode) {
      setImageUrl(null);
      return;
    }
    let cancelled = false;
    setImageLoading(true);
    // Request high-res so full-width scaling stays crisp on retina.
    getBarcodeImageDataUrl(barcode, 800, 240)
      .then((url) => {
        if (!cancelled) setImageUrl(url);
      })
      .finally(() => {
        if (!cancelled) setImageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, barcode]);

  const assign = (code?: string) => {
    startTransition(async () => {
      try {
        await assignBarcode(variantId, code);
        toast({
          title: code ? "Barcode assigned" : "Barcode generated",
          description: variantName,
        });
        setCustom("");
        onOpenChange(false);
        router.refresh();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Couldn't save barcode",
          description: error?.message ?? "Request failed",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Barcode · {variantName}</DialogTitle>
          <DialogDescription>
            Auto-generate an EAN-13 code or enter your own (max 128 chars).
            Barcodes must be unique across the location.
          </DialogDescription>
        </DialogHeader>

        {barcode && (
          <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm">
            {imageLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={barcode}
                className="block w-full h-auto"
              />
            ) : (
              <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                Preview unavailable
              </div>
            )}
            <p className="mt-3 text-center font-mono text-sm tracking-widest text-slate-700">
              {barcode}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium">Custom barcode</label>
          <div className="flex gap-2">
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="e.g. 5901234123457"
              disabled={isPending || disabled}
              maxLength={128}
            />
            <Button
              type="button"
              onClick={() => assign(custom.trim())}
              disabled={isPending || disabled || custom.trim().length === 0}
            >
              Save
            </Button>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => assign()}
            disabled={isPending || disabled}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Auto-generate EAN-13
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BarcodePrintDialog({
  open,
  onOpenChange,
  variantName,
  barcode,
  sku,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  variantName: string;
  barcode: string;
  sku?: string | null;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copies, setCopies] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setImageUrl(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    // Larger render for printing — label printers resample anyway.
    getBarcodeImageDataUrl(barcode, 1200, 360)
      .then((url) => {
        if (!cancelled) setImageUrl(url);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, barcode]);

  const onPrint = () => {
    if (!imageUrl) return;
    const win = window.open("", "_blank", "width=500,height=400");
    if (!win) {
      toast({
        variant: "destructive",
        title: "Couldn't open print window",
        description: "Allow pop-ups for this site and try again.",
      });
      return;
    }
    const labels = Array.from({ length: Math.max(1, Math.min(copies, 200)) })
      .map(
        () => `
          <div class="label">
            <div class="name">${escapeHtml(variantName)}</div>
            ${sku ? `<div class="sku">${escapeHtml(sku)}</div>` : ""}
            <img src="${imageUrl}" alt="${escapeHtml(barcode)}" />
            <div class="code">${escapeHtml(barcode)}</div>
          </div>
        `,
      )
      .join("");
    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Label · ${escapeHtml(variantName)}</title>
          <style>
            @page { margin: 6mm; }
            *, *::before, *::after { box-sizing: border-box; }
            body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
            .sheet {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(48mm, 1fr));
              gap: 3mm;
            }
            .label {
              padding: 2mm;
              text-align: center;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .name { font-size: 10px; font-weight: 600; line-height: 1.2; margin-bottom: 1px; }
            .sku { font-size: 8px; color: #666; margin-bottom: 2px; }
            .label img { width: 100%; height: auto; display: block; }
            .code { font-family: monospace; font-size: 9px; letter-spacing: 0.08em; margin-top: 1px; }
          </style>
        </head>
        <body>
          <div class="sheet">${labels}</div>
          <script>
            window.addEventListener('load', function () {
              window.focus();
              window.print();
              setTimeout(function () { window.close(); }, 500);
            });
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Print label · {variantName}</DialogTitle>
          <DialogDescription>
            Opens a print-ready window. Load 50mm-wide label stock or standard
            paper.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 shadow-sm">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt={barcode} className="block w-full h-auto" />
          ) : (
            <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
              Preview unavailable
            </div>
          )}
          <p className="mt-3 text-center font-mono text-sm tracking-widest text-slate-700">
            {barcode}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium">Copies</label>
          <Input
            type="number"
            min={1}
            max={200}
            value={copies}
            onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 1))}
            className="w-24"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 mr-1.5" />
            Cancel
          </Button>
          <Button type="button" onClick={onPrint} disabled={!imageUrl || loading}>
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
