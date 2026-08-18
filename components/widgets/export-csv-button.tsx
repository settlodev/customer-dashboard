"use client";

import { useState, useTransition } from "react";
import { Download, Loader2, CalendarRange } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  exportInventoryCsv,
  exportMovementsCsv,
} from "@/lib/actions/export-actions";

const MOVEMENT_DEFAULT_DAYS = 30;

/**
 * Compact download menu for the stock list page. Offers:
 *  - Inventory snapshot CSV (all on-hand balances at this location)
 *  - Movements CSV over a user-picked date range
 */
export function ExportCsvButton() {
  const [movementsOpen, setMovementsOpen] = useState(false);
  const [isInventoryPending, startInventory] = useTransition();
  const { toast } = useToast();

  const triggerDownload = (csv: string, filename: string) => {
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
  };

  const downloadInventory = () => {
    startInventory(async () => {
      try {
        const payload = await exportInventoryCsv();
        triggerDownload(payload.csv, payload.filename);
        toast({
          title: "Inventory export ready",
          description: payload.filename,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Couldn't export inventory",
          description: error?.message ?? "Request failed",
        });
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isInventoryPending}>
            {isInventoryPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1.5" />
            )}
            Export CSV
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={downloadInventory} disabled={isInventoryPending}>
            <Download className="h-4 w-4 mr-2" />
            Inventory snapshot
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMovementsOpen(true)}>
            <CalendarRange className="h-4 w-4 mr-2" />
            Movements (date range)…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MovementsDateDialog
        open={movementsOpen}
        onOpenChange={setMovementsOpen}
        onDownload={triggerDownload}
      />
    </>
  );
}

function MovementsDateDialog({
  open,
  onOpenChange,
  onDownload,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onDownload: (csv: string, filename: string) => void;
}) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - MOVEMENT_DEFAULT_DAYS);

  const [from, setFrom] = useState(start.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const onConfirm = () => {
    if (!from || !to) {
      toast({
        variant: "destructive",
        title: "Pick a date range",
      });
      return;
    }
    if (to < from) {
      toast({
        variant: "destructive",
        title: "End date must be on or after start date",
      });
      return;
    }
    startTransition(async () => {
      try {
        const payload = await exportMovementsCsv(from, to);
        onDownload(payload.csv, payload.filename);
        toast({
          title: "Movements export ready",
          description: payload.filename,
        });
        onOpenChange(false);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Couldn't export movements",
          description: error?.message ?? "Request failed",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export stock movements</DialogTitle>
          <DialogDescription>
            Pulls every stock movement (PURCHASE, SALE, TRANSFER, etc.) in the
            range inclusive. Streams directly from the backend.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} disabled={isPending} />
          </div>
          <div>
            <label className="text-xs font-medium">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} disabled={isPending} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Standalone trigger for one of the export types, used when the dropdown isn't
// ideal (e.g. when a caller only wants inventory).
export function ExportInventoryButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const download = () =>
    startTransition(async () => {
      try {
        const { csv, filename } = await exportInventoryCsv();
        const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(href);
        toast({ title: "Inventory export ready", description: filename });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Couldn't export inventory",
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
