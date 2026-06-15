"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendAccountEmail } from "@/lib/actions/admin/accounts";

interface SendEmailDialogProps {
  accountId: string;
  recipientEmail: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function SendEmailDialog({
  accountId,
  recipientEmail,
  open,
  onOpenChange,
}: SendEmailDialogProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const canSubmit = subject.trim().length > 0 && body.trim().length > 0;

  const handleClose = (o: boolean) => {
    if (!o) {
      setSubject("");
      setBody("");
    }
    onOpenChange(o);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    startTransition(async () => {
      const res = await sendAccountEmail(accountId, subject.trim(), body.trim());
      if (res.responseType === "success") {
        toast({ title: "Email queued", description: res.message });
        setSubject("");
        setBody("");
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't send",
          description: res.message,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Compose email</DialogTitle>
          <DialogDescription>
            Send an email directly to this account holder.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5">
            <Label className="text-[12.5px] font-semibold text-muted-foreground uppercase tracking-wide">
              To
            </Label>
            <p className="font-mono text-[13px] text-ink">{recipientEmail}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              placeholder="Subject…"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isPending}
              maxLength={250}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email-body">Body</Label>
            <Textarea
              id="email-body"
              placeholder="Message…"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isPending}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </span>
              ) : (
                "Send email"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Wrapper button (holds open state; safe to render inside server components) ──
interface AccountEmailButtonProps {
  accountId: string;
  recipientEmail: string;
}

export function AccountEmailButton({
  accountId,
  recipientEmail,
}: AccountEmailButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Mail className="h-4 w-4" />
        Email
      </Button>
      <SendEmailDialog
        accountId={accountId}
        recipientEmail={recipientEmail}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
