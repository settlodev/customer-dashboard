"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { revealMasterKey, rotateMasterKey } from "@/lib/actions/admin/master-key";
import type { MasterKeyResponse } from "@/types/admin/master-key";

/**
 * How long the key stays on screen before hiding itself again. Reading it is
 * audited and it is a live credential, so it should not survive the operator
 * walking away from the desk.
 */
const AUTO_HIDE_MS = 60_000;

function formatWhen(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function expiresIn(value: string | null): string | null {
  if (!value) return null;
  const ms = new Date(value).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return "expired — the next read will mint a new one";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m from now`;
  return `${minutes}m from now`;
}

export function MasterKeyView() {
  const [entry, setEntry] = useState<MasterKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingRotate, setConfirmingRotate] = useState(false);
  const [isRevealing, startReveal] = useTransition();
  const [isRotating, startRotate] = useTransition();
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    setEntry(null);
    setCopied(false);
  }, [clearTimer]);

  // Drop the key from memory when the operator navigates away.
  useEffect(() => hide, [hide]);

  const armAutoHide = useCallback(() => {
    clearTimer();
    hideTimer.current = setTimeout(hide, AUTO_HIDE_MS);
  }, [clearTimer, hide]);

  const onReveal = () => {
    startReveal(async () => {
      const result = await revealMasterKey();
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Couldn't read the key",
          description: result.message,
        });
        return;
      }
      setEntry(result.data);
      setCopied(false);
      armAutoHide();
    });
  };

  const onRotate = () => {
    startRotate(async () => {
      const result = await rotateMasterKey();
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Rotation failed",
          description: result.message,
        });
        return;
      }
      setConfirmingRotate(false);
      setEntry(result.data);
      setCopied(false);
      armAutoHide();
      toast({
        title: "Master key rotated",
        description:
          "The previous key stopped working immediately. Anyone mid-flow needs the new value.",
      });
    });
  };

  const onCopy = async () => {
    if (!entry) return;
    try {
      await navigator.clipboard.writeText(entry.key);
      setCopied(true);
      armAutoHide();
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      toast({
        variant: "destructive",
        title: "Couldn't copy",
        description: "Your browser blocked clipboard access — select and copy manually.",
      });
    }
  };

  const busy = isRevealing || isRotating;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border bg-card p-5">
        <div className="mb-4 flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <h2 className="text-sm font-medium">Current key</h2>
            <p className="text-sm text-muted-foreground">
              Required in addition to your own sign-in when logging in as a staff
              member. Every read is recorded against your account.
            </p>
          </div>
        </div>

        {entry ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-md border bg-muted px-3 py-2 font-mono text-base tracking-wider">
                {entry.key}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCopy}
                aria-label="Copy the master key"
              >
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-4 w-4" /> Copy
                  </>
                )}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={hide}>
                <EyeOff className="mr-1.5 h-4 w-4" /> Hide
              </Button>
            </div>

            <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto,1fr]">
              <dt className="text-muted-foreground">Expires</dt>
              <dd>
                {formatWhen(entry.expiresAt)}
                {expiresIn(entry.expiresAt) ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {expiresIn(entry.expiresAt)}
                  </span>
                ) : null}
              </dd>
              <dt className="text-muted-foreground">Minted</dt>
              <dd>{formatWhen(entry.rotatedAt)}</dd>
            </dl>

            <p className="text-xs text-muted-foreground">
              Hides automatically after a minute.
            </p>
          </div>
        ) : (
          <Button type="button" onClick={onReveal} disabled={busy}>
            <Eye className="mr-1.5 h-4 w-4" />
            {isRevealing ? "Reading…" : "Reveal key"}
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
        <h2 className="text-sm font-medium">Rotate now</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The key rotates on its own every day. Rotate manually only if you think
          the current value has leaked — it stops working everywhere the moment
          you confirm, including for anyone mid-impersonation.
        </p>

        {confirmingRotate ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRotate}
              disabled={busy}
            >
              <RotateCw className="mr-1.5 h-4 w-4" />
              {isRotating ? "Rotating…" : "Yes, rotate it"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingRotate(false)}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setConfirmingRotate(true)}
            disabled={busy}
          >
            <RotateCw className="mr-1.5 h-4 w-4" /> Rotate key
          </Button>
        )}
      </div>
    </div>
  );
}
