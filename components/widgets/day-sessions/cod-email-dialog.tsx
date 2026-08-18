"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { emailCloseOfDayReport } from "@/lib/actions/day-session-email-actions";

/**
 * "Email report" control on the session dashboard — emails a Close-of-Day
 * summary (headline figures) with a link to the full online report, via
 * the shared `close-of-day-summary` template. Enter one or more recipient
 * addresses (comma/space separated).
 */
export function CodEmailButton({
  locationId,
  sessionId,
  businessDate,
  identifier,
}: {
  locationId: string;
  sessionId: string;
  businessDate?: string;
  identifier?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [isSending, startSend] = useTransition();
  const { toast } = useToast();

  const send = () => {
    const recipients = value
      .split(/[,\s]+/)
      .map((r) => r.trim())
      .filter(Boolean);
    startSend(async () => {
      const res = await emailCloseOfDayReport(locationId, sessionId, recipients, {
        businessDate,
        identifier,
      });
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't send report",
          description: res.message,
        });
        return;
      }
      toast({ title: "Report sent", description: res.message });
      setValue("");
      setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line-2 bg-card px-[13px] text-[13px] font-semibold text-ink-2 transition-colors hover:bg-canvas"
      >
        <Mail className="h-[15px] w-[15px] text-ink-3" />
        <span className="hidden sm:inline">Email</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Close of Day report</DialogTitle>
            <DialogDescription>
              We&apos;ll email a summary with a link to the full report.
              Separate multiple addresses with commas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-2">Recipients</label>
            <Input
              type="text"
              inputMode="email"
              placeholder="owner@business.com, accountant@business.com"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSending && value.trim()) send();
              }}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={send} disabled={isSending || !value.trim()}>
              {isSending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-4 w-4" />
              )}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
