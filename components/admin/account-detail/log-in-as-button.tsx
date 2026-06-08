"use client";

import { useState, useTransition } from "react";
import { Loader2, LogIn } from "lucide-react";

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
import { impersonateAccount } from "@/lib/actions/admin/impersonation";

/**
 * "Log in as" — staff impersonation entry point. Opens a dialog to capture an
 * optional reason / ticket (persisted to the audit trail), mints a short-lived
 * customer session via `/auth/impersonate`, and opens it in a new tab. The new
 * tab establishes a first-party session at `/impersonate/consume`.
 */
export function LogInAsButton({ accountId }: { accountId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const start = () => {
    startTransition(async () => {
      const res = await impersonateAccount(accountId, reason);
      if (res.responseType === "success" && res.data?.url) {
        window.open(res.data.url, "_blank", "noopener");
        setOpen(false);
        setReason("");
      } else {
        toast({ title: "Log in as", description: res.message });
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        <LogIn className="h-4 w-4" />
        Log in as
      </Button>

      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Log in as this customer</DialogTitle>
            <DialogDescription>
              Opens a support session in a new tab as this account. The session
              is short-lived and fully audited. Add a reason or ticket reference
              for the audit trail (optional).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="impersonation-reason">Reason / ticket</Label>
            <Textarea
              id="impersonation-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. SUP-1423 — reproduce checkout error"
              rows={3}
              maxLength={500}
              disabled={pending}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={start} disabled={pending}>
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Open session
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
