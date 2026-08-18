import React from "react";
import { Inbox, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface NoItemsProps {
  itemName: string;
  newItemUrl?: string;
  onAdd?: () => void;
  ctaLabel?: string;
  /** Custom CTA node — takes precedence over newItemUrl/onAdd. Useful for dialog-based flows. */
  cta?: React.ReactNode;
}

export default function NoItems({
  itemName,
  newItemUrl,
  onAdd,
  ctaLabel,
  cta,
}: NoItemsProps) {
  const label = ctaLabel ?? `Add ${itemName}`;

  return (
    <div className="relative flex min-h-[calc(100vh-240px)] flex-col items-center justify-center overflow-hidden rounded-xl border border-line bg-card px-6 py-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent"
      />

      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-canvas">
        <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>

      <h2 className="text-lg font-semibold leading-tight tracking-tight text-ink">
        No {itemName} data found
      </h2>

      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        There are no {itemName} records found at the moment. Add a new{" "}
        {itemName} record to start viewing data.
      </p>

      {cta ? (
        <div className="mt-6">{cta}</div>
      ) : newItemUrl ? (
        <Button asChild className="mt-6" size="sm">
          <Link href={newItemUrl}>
            <Plus className="h-4 w-4" /> {label}
          </Link>
        </Button>
      ) : onAdd ? (
        <Button className="mt-6" size="sm" type="button" onClick={onAdd}>
          <Plus className="h-4 w-4" /> {label}
        </Button>
      ) : null}
    </div>
  );
}
