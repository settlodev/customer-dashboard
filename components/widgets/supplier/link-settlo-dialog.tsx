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
  // Set when the catalog fetch itself rejects (e.g. the server action's RPC
  // fails outright) — distinct from `catalog === []`, which is a successful
  // fetch that just found nothing. Without this, a rejected fetch never
  // resolves `catalog` and the select is stuck on "Loading marketplace…"
  // forever.
  const [catalogError, setCatalogError] = useState(false);
  const [picked, setPicked] = useState<string>(supplier.settloSupplierId ?? "");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open && catalog === null && !catalogError) {
      fetchSettloSupplierCatalog()
        .then(setCatalog)
        .catch(() => setCatalogError(true));
    }
  }, [open, catalog, catalogError]);

  const loading = catalog === null && !catalogError;
  const noMatches = catalog !== null && catalog.length === 0;
  // Once the fetch has settled (success or failure), the merchant has seen
  // whatever the directory has to offer (or the fact that it failed to
  // load) — either way, the "submit for review" discovery path should be
  // reachable, not just when the catalog happens to be empty.
  const catalogSettled = !loading;

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
              disabled={isPending || loading || catalogError || noMatches}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loading
                      ? "Loading marketplace…"
                      : catalogError
                        ? "Couldn't load the marketplace directory"
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
            {/* Persistent discovery path, not gated on `noMatches` — a
                merchant scanning a long catalog for a supplier that isn't
                in it (or one that failed to load) needs this route too. */}
            {catalogSettled && (
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
