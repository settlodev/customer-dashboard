"use client";

import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Page-level sticky save bar — the product form's footer, for settings
 * screens that save a whole page at once (Business details, Business
 * settings). Save-state on the left in mono, then Discard (ghost) and the
 * primary Save. Both buttons disable until something is dirty.
 *
 * Per-section saves keep using `SettingsSection`'s own footer; this bar is
 * only for screens where one Save covers every card above it.
 */
export function SettingsSaveBar({
  dirtyCount,
  isPending,
  onSave,
  onDiscard,
  /** Render the primary as a form `type="submit"` instead of calling `onSave`. */
  submit = false,
  saveLabel = "Save changes",
  pendingLabel = "Saving…",
  className,
}: {
  dirtyCount: number;
  isPending: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  submit?: boolean;
  saveLabel?: string;
  pendingLabel?: string;
  className?: string;
}) {
  const isDirty = dirtyCount > 0;
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-2.5 border-t border-line bg-canvas/85 px-4 py-3.5 backdrop-blur-xl md:mx-0 md:px-0",
        className,
      )}
    >
      <span className="inline-flex w-full items-center gap-2 font-mono text-[11px] tracking-[0.02em] text-muted-foreground sm:mr-auto sm:w-auto">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isPending ? "animate-pulse bg-primary" : isDirty ? "bg-warn" : "bg-pos",
          )}
        />
        {isPending
          ? pendingLabel
          : isDirty
            ? `${dirtyCount} unsaved change${dirtyCount === 1 ? "" : "s"}`
            : "No unsaved changes"}
      </span>
      {onDiscard && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => onDiscard()}
          disabled={!isDirty || isPending}
        >
          <Trash2 className="h-3.5 w-3.5" /> Discard
        </Button>
      )}
      <Button
        type={submit ? "submit" : "button"}
        onClick={submit ? undefined : () => onSave?.()}
        disabled={!isDirty || isPending}
        className="flex-1 sm:flex-none"
      >
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {isPending ? pendingLabel : saveLabel}
      </Button>
    </div>
  );
}
