"use client";

import { useEffect, useState, useTransition } from "react";
import { Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitNomination } from "@/lib/actions/supplier-nomination-actions";
import type { Supplier } from "@/types/supplier/type";

interface Props {
  supplier: Supplier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful submit, once this dialog has already closed
   *  itself. Deliberately left to the caller rather than this component
   *  calling `router.refresh()` directly — it's mounted from two different
   *  places (the financing card and the marketplace-link dialog's
   *  empty-state CTA) that each need their own follow-up. */
  onSubmitted: () => void;
}

/**
 * Preview-then-submit dialog for nominating one of the merchant's own
 * suppliers for Settlo review. Previews the fields the backend snapshots
 * onto the nomination at submit time — see `SupplierNominationService.submit`
 * (Inventory Service) — including the phone fallback (company `phone` wins;
 * `contactPersonPhone` only when the company phone is blank). This is a
 * subset, not the full snapshot: the backend also captures `address` and
 * `contactPersonEmail` (visible to staff on the nomination, just not
 * previewed here) plus `city`/`country`, which aren't part of the
 * dashboard's `Supplier` shape at all. Hence the dialog copy says the
 * details "will be sent" rather than claiming this is everything Settlo
 * receives. Nothing here is editable: a blank field renders as a muted
 * "Not set" so the merchant can close, fix it on the supplier's edit page,
 * and reopen to resubmit.
 */
export function SubmitNominationDialog({
  supplier,
  open,
  onOpenChange,
  onSubmitted,
}: Props) {
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Fresh note every time the dialog is (re)opened.
  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  const phone =
    supplier.phone && supplier.phone.trim() !== ""
      ? supplier.phone
      : supplier.contactPersonPhone;

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await submitNomination({
        sourceSupplierId: supplier.id,
        note: note.trim() || undefined,
      });
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't submit for review",
          description: res.message,
        });
        return;
      }
      toast({
        variant: "success",
        title: "Submitted for review",
        description: res.message,
      });
      onOpenChange(false);
      onSubmitted();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit {supplier.name} for Settlo review</DialogTitle>
          <DialogDescription>
            The details below will be sent to Settlo. Close this dialog to
            fix anything below on the supplier&apos;s details, then reopen to
            resubmit.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-line bg-canvas/60 px-4 py-3.5">
          <PreviewField label="Name" value={supplier.name} />
          <PreviewField
            label="Contact person"
            value={supplier.contactPersonName}
          />
          <PreviewField label="Phone" value={phone} />
          <PreviewField label="Email" value={supplier.email} />
          <PreviewField label="TIN" value={supplier.tinNumber} />
          <PreviewField
            label="Registration number"
            value={supplier.registrationNumber}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nomination-note">
            Tell us about your trading relationship — how often you order and
            roughly how much
          </Label>
          <Textarea
            id="nomination-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Optional"
            disabled={isPending}
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-line bg-canvas/60 px-3.5 py-3 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            <span className="font-medium text-foreground">
              What happens next:
            </span>{" "}
            Settlo reviews and contacts the supplier; you&apos;ll be
            notified.
          </span>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit for review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  const isBlank = !value || value.trim() === "";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-gray-400">
        {label}
      </span>
      {isBlank ? (
        <span className="text-sm italic text-muted-foreground">Not set</span>
      ) : (
        <span className="text-sm font-medium break-all">{value}</span>
      )}
    </div>
  );
}
