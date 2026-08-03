"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Link2Off, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  linkSettloSupplier,
  unlinkSettloSupplier,
} from "@/lib/actions/supplier-actions";
import { fetchSettloSupplierCatalog } from "@/lib/actions/settlo-supplier-actions";
import type { SettloSupplierCatalogEntry, Supplier } from "@/types/supplier/type";
import { SubmitNominationDialog } from "./submit-nomination-dialog";

export function LinkSettloSupplierDialog({ supplier }: { supplier: Supplier }) {
  const [open, setOpen] = useState(false);
  // `null` = not fetched yet (loading); `[]` = fetched, genuinely no matches
  // — the two need to render differently below.
  const [catalog, setCatalog] = useState<SettloSupplierCatalogEntry[] | null>(
    null,
  );
  const [picked, setPicked] = useState<string>(supplier.settloSupplierId ?? "");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open && catalog === null) {
      fetchSettloSupplierCatalog().then(setCatalog);
    }
  }, [open, catalog]);

  const loading = catalog === null;
  const noMatches = catalog !== null && catalog.length === 0;

  const onLink = () => {
    if (!picked) return;
    startTransition(async () => {
      const res = await linkSettloSupplier(supplier.id, picked);
      if (res.responseType === "success") {
        toast({ variant: "success", title: "Linked", description: res.message });
        setOpen(false);
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    });
  };

  const onUnlink = () => {
    startTransition(async () => {
      const res = await unlinkSettloSupplier(supplier.id);
      if (res.responseType === "success") {
        toast({ variant: "success", title: "Unlinked", description: res.message });
        setOpen(false);
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={isPending}
        >
          {supplier.linkedToSettloSupplier ? (
            <>
              <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-600" />
              Linked to {supplier.settloSupplierName ?? "marketplace"}
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-1.5" />
              Link to marketplace
            </>
          )}
        </Button>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marketplace link</DialogTitle>
            <DialogDescription>
              Linking pairs this supplier with a Settlo-verified record, unlocking
              financing and verified compliance details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs font-medium">Marketplace supplier</label>
            <Select
              value={picked}
              onValueChange={setPicked}
              disabled={isPending || loading || noMatches}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading
                      ? "Loading marketplace…"
                      : noMatches
                        ? "No matches in the directory"
                        : "Pick a supplier"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(catalog ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {noMatches && (
              <p className="text-xs text-muted-foreground">
                Not in the directory?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setSubmitOpen(true);
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Submit this supplier for review
                </button>
              </p>
            )}
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            {supplier.linkedToSettloSupplier ? (
              <Button
                variant="outline"
                onClick={onUnlink}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Link2Off className="h-4 w-4 mr-1.5" />
                )}
                Unlink
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={onLink}
                disabled={isPending || !picked || picked === supplier.settloSupplierId}
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save link
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SubmitNominationDialog
        supplier={supplier}
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        onSubmitted={() => router.refresh()}
      />
    </>
  );
}
