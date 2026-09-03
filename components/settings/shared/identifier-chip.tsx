"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * "Label: CODE [copy]" — the account-number / location-code chip under a
 * panel header. One place for the mono code styling and the copy affordance.
 */
export function IdentifierChip({
  label,
  value,
  copyLabel = "Copy",
}: {
  label: string;
  value: string;
  copyLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!value) return;
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <code className="rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-xs text-ink">
        {value}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="iconSm"
        onClick={copy}
        aria-label={copyLabel}
        title={copyLabel}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-pos" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}
